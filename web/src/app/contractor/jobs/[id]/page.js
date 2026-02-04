'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Textarea, Select, Alert } from '@/components/ui';
import { workOrderService } from '@/lib/workOrderService';
import { WORKORDER_STATUS, CATEGORIES_LIST } from '@/lib/constants/sla';
import { getWardName } from '@/lib/constants/wards';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

const navigation = [
  { name: 'Dashboard', href: '/contractor/dashboard', icon: '📊' },
  { name: 'Assigned Jobs', href: '/contractor/jobs', icon: '📋' },
  { name: 'Active Jobs', href: '/contractor/jobs/active', icon: '🔨' },
  { name: 'Completed', href: '/contractor/jobs/completed', icon: '✅' },
  { name: 'Route Map', href: '/contractor/map', icon: '🗺️' },
  { name: 'Performance', href: '/contractor/performance', icon: '📈' },
  { name: 'Profile', href: '/contractor/profile', icon: '👤' },
];

const STATUS_FLOW = ['assigned', 'accepted', 'en_route', 'on_site', 'in_progress', 'completed'];

export default function JobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { userData, loading: authLoading } = useAuth();
  const [workOrder, setWorkOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [completionImages, setCompletionImages] = useState([]);
  const [completionNotes, setCompletionNotes] = useState('');

  useEffect(() => {
    if (!authLoading && userData?.role !== 'contractor') {
      router.push('/auth/login');
      return;
    }

    if (userData && params.id) {
      loadWorkOrder();
    }
  }, [userData, authLoading, params.id]);

  const loadWorkOrder = async () => {
    setLoading(true);
    try {
      const result = await workOrderService.getWorkOrderById(params.id);
      if (result.success) {
        setWorkOrder(result.work_order);
      } else {
        setError('Work order not found');
      }
    } catch (error) {
      console.error('Error loading work order:', error);
      setError('Failed to load work order');
    } finally {
      setLoading(false);
    }
  };

  const getNextStatus = (currentStatus) => {
    const currentIndex = STATUS_FLOW.indexOf(currentStatus);
    if (currentIndex >= 0 && currentIndex < STATUS_FLOW.length - 1) {
      return STATUS_FLOW[currentIndex + 1];
    }
    return null;
  };

  const getStatusLabel = (status) => {
    const labels = {
      accepted: 'Mark as En Route',
      en_route: 'Arrived On Site',
      on_site: 'Start Work',
      in_progress: 'Complete Work'
    };
    return labels[status] || 'Update Status';
  };

  const handleStatusUpdate = async (newStatus) => {
    setUpdating(true);
    setError('');
    
    try {
      const result = await workOrderService.updateStatus(
        workOrder.work_order_id,
        newStatus,
        userData.uid,
        statusNote
      );

      if (result.success) {
        setSuccess(`Status updated to ${newStatus}`);
        setStatusNote('');
        loadWorkOrder();
      } else {
        setError(result.error || 'Failed to update status');
      }
    } catch (err) {
      setError('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleAcceptJob = async () => {
    setUpdating(true);
    try {
      const result = await workOrderService.acceptWorkOrder(workOrder.work_order_id, userData.uid);
      if (result.success) {
        setSuccess('Job accepted successfully!');
        loadWorkOrder();
      } else {
        setError(result.error || 'Failed to accept job');
      }
    } catch (err) {
      setError('Failed to accept job');
    } finally {
      setUpdating(false);
    }
  };

  const handleRejectJob = async () => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    setUpdating(true);
    try {
      const result = await workOrderService.rejectWorkOrder(workOrder.work_order_id, reason, userData.uid);
      if (result.success) {
        setSuccess('Job rejected');
        router.push('/contractor/jobs');
      } else {
        setError(result.error || 'Failed to reject job');
      }
    } catch (err) {
      setError('Failed to reject job');
    } finally {
      setUpdating(false);
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + completionImages.length > 5) {
      setError('Maximum 5 images allowed');
      return;
    }

    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));

    setCompletionImages(prev => [...prev, ...newImages]);
  };

  const handleCompleteJob = async () => {
    if (completionImages.length === 0) {
      setError('Please upload at least one completion photo');
      return;
    }

    setUpdating(true);
    setError('');

    try {
      // Upload images first
      const uploadedUrls = [];
      for (const img of completionImages) {
        const fileRef = ref(storage, `work_orders/${workOrder.work_order_id}/completion/${Date.now()}_${img.file.name}`);
        await uploadBytes(fileRef, img.file);
        const url = await getDownloadURL(fileRef);
        uploadedUrls.push(url);
      }

      // Update work order with completion data
      const result = await workOrderService.completeWorkOrder(
        workOrder.work_order_id,
        userData.uid,
        {
          completion_photos: uploadedUrls,
          completion_notes: completionNotes,
          completed_at: new Date()
        }
      );

      if (result.success) {
        setSuccess('Job completed successfully! Awaiting verification.');
        loadWorkOrder();
      } else {
        setError(result.error || 'Failed to complete job');
      }
    } catch (err) {
      setError('Failed to complete job');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadgeVariant = (status) => {
    const variants = {
      created: 'secondary',
      assigned: 'info',
      accepted: 'primary',
      en_route: 'warning',
      on_site: 'warning',
      in_progress: 'warning',
      completed: 'success',
      verified: 'success',
      closed: 'default',
      rejected: 'danger'
    };
    return variants[status] || 'default';
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!workOrder) {
    return (
      <DashboardLayout navigation={navigation} title="Contractor Portal">
        <div className="text-center py-12">
          <span className="text-6xl">❌</span>
          <h2 className="text-xl font-semibold text-gray-900 mt-4">Work Order Not Found</h2>
          <Link href="/contractor/jobs">
            <Button className="mt-4">Back to Jobs</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const nextStatus = getNextStatus(workOrder.status);

  return (
    <DashboardLayout navigation={navigation} title="Contractor Portal">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <Link href="/contractor/jobs" className="text-blue-600 hover:text-blue-700 text-sm">
              ← Back to Jobs
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">{workOrder.work_order_id}</h1>
          </div>
          <div className="flex items-center space-x-3">
            {workOrder.priority === 'emergency' && (
              <Badge variant="danger" className="text-lg px-4 py-2">🚨 URGENT</Badge>
            )}
            <Badge variant={getStatusBadgeVariant(workOrder.status)} className="text-lg px-4 py-2">
              {WORKORDER_STATUS[workOrder.status.toUpperCase()]?.name || workOrder.status}
            </Badge>
          </div>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        {/* Action Panel for Pending Jobs */}
        {workOrder.status === 'assigned' && (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">⏳</span>
                  <div>
                    <h3 className="font-semibold text-yellow-900">Job Awaiting Your Response</h3>
                    <p className="text-sm text-yellow-700">Please accept or reject this job</p>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <Button
                    variant="success"
                    onClick={handleAcceptJob}
                    disabled={updating}
                  >
                    ✅ Accept Job
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleRejectJob}
                    disabled={updating}
                  >
                    ❌ Reject Job
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status Update Panel */}
        {nextStatus && workOrder.status !== 'assigned' && workOrder.status !== 'in_progress' && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">📍</span>
                  <div>
                    <h3 className="font-semibold text-blue-900">Update Job Status</h3>
                    <p className="text-sm text-blue-700">
                      Current: {workOrder.status} → Next: {nextStatus}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => handleStatusUpdate(nextStatus)}
                  disabled={updating}
                >
                  {getStatusLabel(workOrder.status)}
                </Button>
              </div>
              <Textarea
                placeholder="Add notes (optional)"
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                className="mt-3"
                rows={2}
              />
            </CardContent>
          </Card>
        )}

        {/* Completion Panel */}
        {workOrder.status === 'in_progress' && (
          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-900">Complete This Job</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-green-800">
                Upload completion photos and notes to mark this job as complete.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Completion Photos * (Max 5)
                </label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    id="completion-upload"
                  />
                  <label htmlFor="completion-upload" className="cursor-pointer text-blue-600">
                    <span className="text-3xl">📷</span>
                    <p className="mt-2">Click to upload completion photos</p>
                  </label>
                </div>

                {completionImages.length > 0 && (
                  <div className="grid grid-cols-5 gap-2 mt-3">
                    {completionImages.map((img, index) => (
                      <div key={index} className="relative">
                        <img
                          src={img.preview}
                          alt={`Completion ${index + 1}`}
                          className="w-full h-16 object-cover rounded"
                        />
                        <button
                          type="button"
                          onClick={() => setCompletionImages(prev => prev.filter((_, i) => i !== index))}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Textarea
                label="Completion Notes"
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                placeholder="Describe the work completed..."
                rows={3}
              />

              <Button
                onClick={handleCompleteJob}
                disabled={updating || completionImages.length === 0}
                className="w-full"
              >
                {updating ? 'Submitting...' : '✅ Mark as Completed'}
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Work Order Details */}
          <Card>
            <CardHeader>
              <CardTitle>Work Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <span className="text-3xl">
                  {CATEGORIES_LIST.find(c => c.id === workOrder.category)?.icon || '🔧'}
                </span>
                <div>
                  <p className="font-medium text-gray-900">
                    {CATEGORIES_LIST.find(c => c.id === workOrder.category)?.name || workOrder.category}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500">Description</h4>
                <p className="text-gray-900 mt-1">{workOrder.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Priority</h4>
                  <Badge variant={workOrder.priority === 'emergency' ? 'danger' : 'secondary'} className="mt-1">
                    {workOrder.priority?.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Assigned On</h4>
                  <p className="text-gray-900 mt-1">{formatDate(workOrder.assigned_at)}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500">Location</h4>
                <p className="text-gray-900 mt-1">{workOrder.location?.address || 'N/A'}</p>
                <p className="text-sm text-gray-500">
                  Ward: {getWardName(workOrder.ward_id)}
                </p>
              </div>

              {workOrder.report_id && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Related Report</h4>
                  <p className="text-gray-900 mt-1">{workOrder.report_id}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Issue Images */}
          <Card>
            <CardHeader>
              <CardTitle>Issue Images</CardTitle>
            </CardHeader>
            <CardContent>
              {workOrder.images && workOrder.images.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {workOrder.images.map((img, index) => (
                    <a
                      key={index}
                      href={img}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src={img}
                        alt={`Issue ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg hover:opacity-90"
                      />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No images attached</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Completion Photos (if completed) */}
        {workOrder.completion_photos && workOrder.completion_photos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Completion Photos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {workOrder.completion_photos.map((img, index) => (
                  <a
                    key={index}
                    href={img}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      src={img}
                      alt={`Completion ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg hover:opacity-90"
                    />
                  </a>
                ))}
              </div>
              {workOrder.completion_notes && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-500">Completion Notes</h4>
                  <p className="text-gray-900 mt-1">{workOrder.completion_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Status History */}
        {workOrder.status_history && workOrder.status_history.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Status History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {workOrder.status_history.map((history, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Status: {history.status}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(history.timestamp)}
                      </p>
                      {history.notes && (
                        <p className="text-sm text-gray-600 mt-1">{history.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
