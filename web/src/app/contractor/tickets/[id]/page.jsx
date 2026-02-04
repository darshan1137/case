'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Alert } from '@/components/ui';
import TicketTimeline from '@/components/TicketTimeline';

export default function ContractorTicketDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { userData, loading: authLoading } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [proofImage, setProofImage] = useState(null);
  const [proofImagePreview, setProofImagePreview] = useState('');

  const ticketId = params.id;

  const navigation = [
    { name: 'Dashboard', href: '/contractor/dashboard', icon: '📊' },
    { name: 'Assigned Jobs', href: '/contractor/jobs', icon: '📋' },
    { name: 'Tickets', href: '/contractor/tickets', icon: '🎫' },
    { name: 'Profile', href: '/contractor/profile', icon: '👤' },
    { name: 'Change Password', href: '/contractor/change-password', icon: '🔐' },
  ];

  useEffect(() => {
    if (authLoading) return;

    if (userData?.role !== 'contractor') {
      router.push('/auth/login');
      return;
    }

    loadTicket();
  }, [userData, authLoading, ticketId, router]);

  const loadTicket = async () => {
    setLoading(true);
    try {
      const userId = userData.id || userData.uid;
      const response = await fetch(`/api/tickets?userId=${userId}&role=contractor&search=${encodeURIComponent(ticketId)}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load ticket');
      }

      const data = await response.json();
      const foundTicket = data.tickets?.find(t => t.ticket_id === ticketId || t.id === ticketId);

      if (!foundTicket) {
        setError('Ticket not found or not assigned to you');
        return;
      }

      // Verify ticket is assigned to this contractor
      if (foundTicket.assigned_to !== userId) {
        setError('This ticket is not assigned to you');
        return;
      }

      setTicket(foundTicket);
      if (foundTicket.images && foundTicket.images.length > 0) {
        setSelectedImage(foundTicket.images[0]);
      }
    } catch (err) {
      console.error('Error loading ticket:', err);
      setError(err.message || 'Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  };

  const uploadToCloudinary = async (file) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
    const apiSecret = process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error('Cloudinary configuration is missing. Please check your .env.local file.');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', apiKey);
    formData.append('timestamp', Math.floor(Date.now() / 1000).toString());

    const signature = await generateCloudinarySignature(
      formData.get('timestamp'),
      apiSecret
    );
    formData.append('signature', signature);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to upload image to Cloudinary');
      }

      const data = await response.json();
      return data.secure_url;
    } catch (err) {
      console.error('Cloudinary upload error:', err);
      throw new Error('Failed to upload image. Please try again.');
    }
  };

  const generateCloudinarySignature = async (timestamp, apiSecret) => {
    const signatureString = `timestamp=${timestamp}${apiSecret}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(signatureString);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleProofImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('Image size should be less than 10MB');
        return;
      }
      setProofImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStartWork = async () => {
    if (!confirm('Start work on this ticket?')) return;

    setActionLoading(true);
    try {
      const userId = userData.id || userData.uid;
      const response = await fetch(`/api/tickets/${ticketId}/start`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          user_role: 'contractor'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start work');
      }

      alert('✓ Work started successfully');
      await loadTicket();
    } catch (err) {
      alert(`Failed to start work: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveTicket = async () => {
    if (!proofImage) {
      alert('Please upload a proof of work image before resolving');
      return;
    }

    setActionLoading(true);
    try {
      const proofImageUrl = await uploadToCloudinary(proofImage);

      const userId = userData.id || userData.uid;
      const response = await fetch(`/api/tickets/${ticketId}/resolve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          user_role: 'contractor',
          resolution_notes: resolutionNotes || undefined,
          proof_of_work: proofImageUrl
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to resolve ticket');
      }

      alert('✓ Ticket resolved successfully with proof of work');
      setShowResolveModal(false);
      setResolutionNotes('');
      setProofImage(null);
      setProofImagePreview('');
      await loadTicket();
    } catch (err) {
      alert(`Failed to resolve ticket: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      assigned: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-orange-100 text-orange-800',
      resolved: 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getSeverityColor = (severity) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      moderate: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return colors[severity] || 'bg-gray-100 text-gray-800';
  };

  const getAvailableActions = () => {
    if (!ticket) return [];
    const actions = [];
    const status = ticket.status;

    if (status === 'assigned') {
      actions.push('start');
    }

    if (status === 'in_progress') {
      actions.push('resolve');
    }

    return actions;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <DashboardLayout navigation={navigation} title="Contractor Portal">
        <div className="max-w-2xl mx-auto">
          <div className="mb-4">
            <Link href="/contractor/tickets">
              <Button variant="outline">← Back to Tickets</Button>
            </Link>
          </div>
          <Alert variant="danger">
            {error || 'Ticket not found'}
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navigation={navigation} title="Contractor Portal">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Link href="/contractor/tickets">
            <Button variant="outline" className="mb-4">← Back to Tickets</Button>
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{ticket.title}</h1>
              <p className="text-gray-600 mt-2">{ticket.ticket_id}</p>
            </div>
            <div className="flex gap-2">
              <Badge className={getSeverityColor(ticket.severity_level)}>
                {ticket.severity_level?.toUpperCase() || 'N/A'}
              </Badge>
              <Badge className={getStatusColor(ticket.status)}>
                {ticket.status?.toUpperCase() || 'PENDING'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 flex-wrap">
              {getAvailableActions().includes('start') && (
                <Button
                  onClick={handleStartWork}
                  disabled={actionLoading}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                >
                  {actionLoading ? '⏳ Processing...' : '⚙️ Start Work'}
                </Button>
              )}

              {getAvailableActions().includes('resolve') && (
                <Button
                  onClick={() => setShowResolveModal(true)}
                  disabled={actionLoading}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                >
                  {actionLoading ? '⏳ Processing...' : '✓ Mark as Resolved'}
                </Button>
              )}

              {getAvailableActions().length === 0 && (
                <p className="text-gray-500 text-sm">
                  No actions available for current ticket status
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Resolve Modal */}
        {showResolveModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Mark as Resolved</h2>
              <p className="text-gray-600 mb-6">Upload proof of work and add resolution notes:</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Proof of Work Image <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProofImageChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  {proofImagePreview && (
                    <div className="mt-3 rounded-lg overflow-hidden border border-gray-300">
                      <img
                        src={proofImagePreview}
                        alt="Proof of work preview"
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Upload a photo showing the completed work (max 10MB)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resolution Notes (Optional)
                  </label>
                  <textarea
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Describe how the issue was resolved..."
                    rows="4"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowResolveModal(false);
                      setResolutionNotes('');
                      setProofImage(null);
                      setProofImagePreview('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleResolveTicket}
                    disabled={actionLoading || !proofImage}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50"
                  >
                    {actionLoading ? 'Resolving...' : 'Resolve'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

         {/* Work Milestone Timeline */}
        <TicketTimeline ticket={ticket} />

        {/* Proof of Work */}
        {ticket.proof_of_work && (
          <Card>
            <CardHeader>
              <CardTitle>✅ Proof of Work</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="rounded-lg overflow-hidden bg-gray-100 border-2 border-green-500">
                  <img
                    src={ticket.proof_of_work}
                    alt="Proof of completed work"
                    className="w-full h-auto max-h-96 object-contain cursor-pointer"
                    onClick={() => window.open(ticket.proof_of_work, '_blank')}
                  />
                </div>
                <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-lg">
                  <span className="text-xl">✓</span>
                  <p className="text-sm font-medium">Work completed and verified with photographic evidence</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Image Gallery */}
        {ticket.images && ticket.images.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Evidence Images</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedImage && (
                  <div className="rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={selectedImage}
                      alt="Selected ticket image"
                      className="w-full h-auto max-h-96 object-contain cursor-pointer"
                      onClick={() => window.open(selectedImage, '_blank')}
                    />
                  </div>
                )}

                <div className="flex gap-2 overflow-x-auto pb-2">
                  {ticket.images.map((imageUrl, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(imageUrl)}
                      className={`relative flex-shrink-0 w-20 h-20 rounded border-2 overflow-hidden transition-all ${
                        selectedImage === imageUrl
                          ? 'border-blue-500'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <img
                        src={imageUrl}
                        alt={`Thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {ticket.description}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Issue Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Issue Type</p>
                <p className="font-semibold text-gray-900">{ticket.issue_type || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Department</p>
                <p className="font-semibold text-gray-900">{ticket.department || 'N/A'}</p>
              </div>
              {ticket.sub_department && (
                <div>
                  <p className="text-sm text-gray-500">Sub Department</p>
                  <p className="font-semibold text-gray-900">{ticket.sub_department}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Assignment & Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Assignment & Timeline</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Assigned On</p>
              <p className="font-semibold text-gray-900">{formatDate(ticket.assigned_at)}</p>
            </div>
            {ticket.in_progress_start_at && (
              <div>
                <p className="text-sm text-gray-500">Work Started</p>
                <p className="font-semibold text-gray-900">{formatDate(ticket.in_progress_start_at)}</p>
              </div>
            )}
            {ticket.resolved_at && (
              <div>
                <p className="text-sm text-gray-500">Resolved On</p>
                <p className="font-semibold text-gray-900">{formatDate(ticket.resolved_at)}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">Last Updated</p>
              <p className="font-semibold text-gray-900">{formatDate(ticket.updated_at)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Citizen Information */}
        <Card>
          <CardHeader>
            <CardTitle>Citizen Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-semibold text-gray-900">{ticket.citizen_name || 'Anonymous'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-semibold text-gray-900">{ticket.citizen_phone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Ward</p>
              <p className="font-semibold text-gray-900">{ticket.ward || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Submitted On</p>
              <p className="font-semibold text-gray-900">{formatDate(ticket.created_at)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
