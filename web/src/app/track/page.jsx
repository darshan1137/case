'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Alert } from '@/components/ui';
import { reportService } from '@/lib/reportService';
import { REPORT_STATUS, CATEGORIES_LIST } from '@/lib/constants/sla';

export default function TrackStatusPage() {
  const router = useRouter();
  const [reportId, setReportId] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!reportId.trim()) {
      setError('Please enter a report ID');
      return;
    }

    setError('');
    setLoading(true);
    setSearched(true);
    
    try {
      const result = await reportService.getReportById(reportId.trim());
      if (result.success) {
        setReport(result.report);
      } else {
        setReport(null);
        setError('Report not found. Please check the ID and try again.');
      }
    } catch (err) {
      setError('Failed to search. Please try again.');
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      submitted: 'bg-gray-100 text-gray-800',
      accepted: 'bg-blue-100 text-blue-800',
      assigned: 'bg-purple-100 text-purple-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      verified: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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
    if (!report || report.status === 'rejected') return -1;
    return statusSteps.findIndex(step => step.key === report.status);
  };

  const currentStep = getCurrentStepIndex();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-3">
              <span className="text-3xl">🏛️</span>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Municipal Corporation</h1>
                <p className="text-sm text-gray-500">Track Your Report</p>
              </div>
            </Link>
            <div className="flex space-x-4">
              <Link href="/auth/login">
                <Button variant="outline">Login</Button>
              </Link>
              <Link href="/auth/register">
                <Button>Register</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Search Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <span className="mr-2">🔍</span>
              Track Your Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex space-x-4">
              <Input
                placeholder="Enter Report ID (e.g., RPT-2025-0001)"
                value={reportId}
                onChange={(e) => setReportId(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={loading}>
                {loading ? 'Searching...' : 'Track'}
              </Button>
            </form>
            <p className="text-sm text-gray-500 mt-2">
              Enter your report ID to track the current status
            </p>
          </CardContent>
        </Card>

        {error && <Alert variant="danger" className="mb-6">{error}</Alert>}

        {/* Results */}
        {searched && !loading && report && (
          <div className="space-y-6">
            {/* Status Banner */}
            <Card className={report.status === 'rejected' ? 'border-red-200 bg-red-50' : ''}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-4xl">
                      {CATEGORIES_LIST.find(c => c.id === report.category)?.icon || '📋'}
                    </span>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{report.report_id}</h2>
                      <p className="text-gray-600">
                        {CATEGORIES_LIST.find(c => c.id === report.category)?.name || report.category}
                      </p>
                    </div>
                  </div>
                  <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusBadgeColor(report.status)}`}>
                    {REPORT_STATUS[report.status.toUpperCase()]?.name || report.status}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Progress Timeline */}
            {report.status !== 'rejected' && (
              <Card>
                <CardHeader>
                  <CardTitle>Progress Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
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
                          className={`text-xs mt-2 text-center ${
                            index <= currentStep ? 'text-green-600 font-medium' : 'text-gray-400'
                          }`}
                        >
                          {step.label}
                        </span>
                        {index < statusSteps.length - 1 && (
                          <div
                            className={`absolute top-5 left-12 w-8 md:w-12 lg:w-16 h-0.5 ${
                              index < currentStep ? 'bg-green-500' : 'bg-gray-200'
                            }`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Rejection Reason */}
            {report.status === 'rejected' && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="text-red-900">Report Rejected</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-red-800">
                    {report.rejection_reason || 'This report was rejected by the validation officer.'}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Report Details */}
            <Card>
              <CardHeader>
                <CardTitle>Report Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Description</h4>
                  <p className="text-gray-900 mt-1">{report.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Submitted On</h4>
                    <p className="text-gray-900 mt-1">{formatDate(report.created_at)}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Priority</h4>
                    <p className="text-gray-900 mt-1 capitalize">{report.priority}</p>
                  </div>
                </div>

                {report.location?.address && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Location</h4>
                    <p className="text-gray-900 mt-1">{report.location.address}</p>
                  </div>
                )}

                {report.work_order_id && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Assigned Work Order</h4>
                    <p className="text-gray-900 mt-1">{report.work_order_id}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Images */}
            {report.images && report.images.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Attached Images</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    {report.images.map((img, index) => (
                      <a
                        key={index}
                        href={img}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <img
                          src={img}
                          alt={`Report image ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg hover:opacity-90 transition-opacity"
                        />
                      </a>
                    ))}
                  </div>
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

            {/* Login CTA */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-blue-900">Want more features?</h3>
                    <p className="text-sm text-blue-700">Login to rate resolutions and get updates</p>
                  </div>
                  <Link href="/auth/login">
                    <Button>Login Now</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* No Results */}
        {searched && !loading && !report && !error && (
          <Card>
            <CardContent className="py-12 text-center">
              <span className="text-6xl">❌</span>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Report Not Found</h3>
              <p className="text-gray-500 mt-2">
                Please check the report ID and try again
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
