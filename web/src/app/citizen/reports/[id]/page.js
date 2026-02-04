'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Textarea, Alert } from '@/components/ui';
import { reportService } from '@/lib/reportService';
import { REPORT_STATUS, CATEGORIES_LIST } from '@/lib/constants/sla';
import { getWardName } from '@/lib/constants/wards';

const navigation = [
  { name: 'Dashboard', href: '/citizen/dashboard', icon: '📊' },
  { name: 'New Report', href: '/citizen/reports/new', icon: '📝' },
  { name: 'My Reports', href: '/citizen/reports', icon: '📋' },
  { name: 'Track Status', href: '/citizen/track', icon: '🔍' },
  { name: 'Profile', href: '/citizen/profile', icon: '👤' },
];

export default function ReportDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { userData, loading: authLoading } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ rating: 0, comment: '' });
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!authLoading && userData?.role !== 'citizen') {
      router.push('/auth/login');
      return;
    }

    if (userData && params.id) {
      loadReport();
    }
  }, [userData, authLoading, params.id]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const result = await reportService.getReportById(params.id);
      if (result.success) {
        setReport(result.report);
      } else {
        setError('Report not found');
      }
    } catch (error) {
      console.error('Error loading report:', error);
      setError('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status) => {
    const variants = {
      submitted: 'secondary',
      accepted: 'info',
      assigned: 'warning',
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

  const handleFeedbackSubmit = async () => {
    if (feedback.rating === 0) {
      setError('Please select a rating');
      return;
    }

    setSubmittingFeedback(true);
    setError('');
    
    try {
      const result = await reportService.submitFeedback(report.report_id, {
        citizen_rating: feedback.rating,
        citizen_feedback: feedback.comment,
        feedback_date: new Date()
      });

      if (result.success) {
        setSuccess('Feedback submitted successfully!');
        loadReport();
      } else {
        setError(result.error || 'Failed to submit feedback');
      }
    } catch (err) {
      setError('Failed to submit feedback');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const statusSteps = [
    { key: 'submitted', label: 'Submitted', icon: '📝' },
    { key: 'accepted', label: 'Accepted', icon: '✅' },
    { key: 'assigned', label: 'Assigned', icon: '👷' },
    { key: 'in_progress', label: 'In Progress', icon: '🔧' },
    { key: 'completed', label: 'Completed', icon: '✔️' },
    { key: 'verified', label: 'Verified', icon: '🔍' },
    { key: 'closed', label: 'Closed', icon: '🏁' }
  ];

  const getCurrentStepIndex = () => {
    if (report?.status === 'rejected') return -1;
    return statusSteps.findIndex(step => step.key === report?.status);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!report) {
    return (
      <DashboardLayout navigation={navigation} title="Citizen Portal">
        <div className="text-center py-12">
          <span className="text-6xl">❌</span>
          <h2 className="text-xl font-semibold text-gray-900 mt-4">Report Not Found</h2>
          <Link href="/citizen/reports">
            <Button className="mt-4">Back to Reports</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const currentStep = getCurrentStepIndex();
  const canGiveFeedback = ['completed', 'verified', 'closed'].includes(report.status) && 
                          !report.citizen_feedback;

  return (
    <DashboardLayout navigation={navigation} title="Citizen Portal">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <Link href="/citizen/reports" className="text-blue-600 hover:text-blue-700 text-sm">
              ← Back to Reports
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">{report.report_id}</h1>
          </div>
          <Badge variant={getStatusBadgeVariant(report.status)} className="text-lg px-4 py-2">
            {REPORT_STATUS[report.status.toUpperCase()]?.name || report.status}
          </Badge>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        {/* Status Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Progress Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            {report.status === 'rejected' ? (
              <div className="text-center py-6">
                <span className="text-4xl">❌</span>
                <p className="text-red-600 font-medium mt-2">Report was rejected</p>
                {report.rejection_reason && (
                  <p className="text-gray-600 mt-1">Reason: {report.rejection_reason}</p>
                )}
              </div>
            ) : (
              <div className="flex justify-between">
                {statusSteps.map((step, index) => (
                  <div key={step.key} className="flex flex-col items-center relative">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                        index <= currentStep
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {step.icon}
                    </div>
                    <span
                      className={`text-xs mt-2 ${
                        index <= currentStep ? 'text-green-600 font-medium' : 'text-gray-400'
                      }`}
                    >
                      {step.label}
                    </span>
                    {index < statusSteps.length - 1 && (
                      <div
                        className={`absolute top-5 left-12 w-16 h-0.5 ${
                          index < currentStep ? 'bg-green-500' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Report Details */}
          <Card>
            <CardHeader>
              <CardTitle>Report Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <span className="text-3xl">
                  {CATEGORIES_LIST.find(c => c.id === report.category)?.icon || '📋'}
                </span>
                <div>
                  <p className="font-medium text-gray-900">
                    {CATEGORIES_LIST.find(c => c.id === report.category)?.name || report.category}
                  </p>
                  {report.subcategory && (
                    <p className="text-sm text-gray-500">{report.subcategory}</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500">Description</h4>
                <p className="text-gray-900 mt-1">{report.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Priority</h4>
                  <Badge variant={report.priority === 'emergency' ? 'danger' : 'secondary'} className="mt-1">
                    {report.priority?.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Submitted On</h4>
                  <p className="text-gray-900 mt-1">{formatDate(report.created_at)}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500">Location</h4>
                <p className="text-gray-900 mt-1">{report.location?.address || 'N/A'}</p>
                <p className="text-sm text-gray-500">
                  Ward: {getWardName(report.ward_id)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle>Images</CardTitle>
            </CardHeader>
            <CardContent>
              {report.images && report.images.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {report.images.map((img, index) => (
                    <a
                      key={index}
                      href={img}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <img
                        src={img}
                        alt={`Report image ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg hover:opacity-90 transition-opacity"
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

        {/* Work Order Info */}
        {report.work_order_id && (
          <Card>
            <CardHeader>
              <CardTitle>Assigned Work Order</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Work Order ID: {report.work_order_id}</p>
                  {report.contractor_name && (
                    <p className="text-sm text-gray-500">Contractor: {report.contractor_name}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Feedback Section */}
        {canGiveFeedback && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-900">Rate This Resolution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-green-800">
                Your report has been resolved. Please rate your experience!
              </p>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedback(prev => ({ ...prev, rating: star }))}
                      className={`text-3xl transition-transform hover:scale-110 ${
                        feedback.rating >= star ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
              </div>

              <Textarea
                label="Your Feedback (Optional)"
                value={feedback.comment}
                onChange={(e) => setFeedback(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="Share your experience..."
                rows={3}
              />

              <Button onClick={handleFeedbackSubmit} disabled={submittingFeedback}>
                {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Existing Feedback Display */}
        {report.citizen_feedback && (
          <Card>
            <CardHeader>
              <CardTitle>Your Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`text-2xl ${
                      report.citizen_rating >= star ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  >
                    ⭐
                  </span>
                ))}
              </div>
              {report.citizen_feedback && (
                <p className="text-gray-700">{report.citizen_feedback}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Status History */}
        {report.status_history && report.status_history.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Status History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {report.status_history.map((history, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Status changed to: {history.status}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(history.timestamp)} by {history.updated_by_name || 'System'}
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
