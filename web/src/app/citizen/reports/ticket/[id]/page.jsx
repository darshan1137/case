'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Alert } from '@/components/ui';

const navigation = [
  { name: 'Dashboard', href: '/citizen/dashboard', icon: '📊' },
  { name: 'New Report', href: '/citizen/reports/new', icon: '📝' },
  { name: 'My Reports', href: '/citizen/reports', icon: '📋' },
  { name: 'Track Status', href: '/citizen/track', icon: '🔍' },
  { name: 'Infrastructure Map', href: '/map', icon: '🗺️' },
  { name: 'Route Optimizer', href: '/route', icon: '🛣️' },
  { name: 'Profile', href: '/citizen/profile', icon: '👤' },
];

export default function TicketDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { userData, loading: authLoading } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);

  const ticketId = params.id;

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (userData?.role !== 'citizen') {
      router.push('/auth/login');
      return;
    }

    loadTicket();
  }, [userData, authLoading, ticketId, router]);

  const loadTicket = async () => {
    setLoading(true);
    try {
      // Fetch the ticket from the API
      const userId = userData.id || userData.uid;
      const response = await fetch(
        `/api/tickets?userId=${userId}&role=citizen&search=${encodeURIComponent(ticketId)}`
      );

      if (!response.ok) {
        throw new Error('Failed to load ticket');
      }

      const data = await response.json();
      const foundTicket = data.tickets?.find(t => t.ticket_id === ticketId);

      if (!foundTicket) {
        setError('Ticket not found');
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
      submitted: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      in_progress: 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getSeverityColor = (severity) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return colors[severity] || 'bg-gray-100 text-gray-800';
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
      <DashboardLayout navigation={navigation} title="Citizen Portal">
        <div className="max-w-2xl mx-auto">
          <div className="mb-4">
            <Link href="/citizen/reports">
              <Button variant="outline">← Back to Reports</Button>
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
    <DashboardLayout navigation={navigation} title="Citizen Portal">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Link href="/citizen/reports">
            <Button variant="outline" className="mb-4">← Back to Reports</Button>
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
                {ticket.status?.toUpperCase() || 'N/A'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Image Gallery */}
        {ticket.images && ticket.images.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Uploaded Images</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Main Image Display */}
                {selectedImage && (
                  <div className="rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={selectedImage}
                      alt="Selected ticket image"
                      className="w-full h-auto max-h-96 object-contain"
                    />
                  </div>
                )}

                {/* Thumbnail Gallery */}
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
          {/* Description */}
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

          {/* Issue Details */}
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
              <div>
                <p className="text-sm text-gray-500">Confidence Score</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${(ticket.confidence_score || 0) * 100}%` }}
                    ></div>
                  </div>
                  <p className="font-semibold text-gray-900 w-12 text-right">
                    {Math.round((ticket.confidence_score || 0) * 100)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Analysis */}
        {ticket.reasoning && (
          <Card>
            <CardHeader>
              <CardTitle>AI Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                {ticket.reasoning}
              </p>
              {ticket.detected && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
                  <span className="text-2xl">✓</span>
                  <p className="text-green-800">Issue detected and verified by AI</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Reporter Information */}
        <Card>
          <CardHeader>
            <CardTitle>Reporter Information</CardTitle>
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
              <p className="text-sm text-gray-500">Submitted On</p>
              <p className="font-semibold text-gray-900">{formatDate(ticket.created_at)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Last Updated</p>
              <p className="font-semibold text-gray-900">{formatDate(ticket.updated_at)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Footer Actions */}
        <div className="flex gap-3">
          <Link href="/citizen/reports">
            <Button variant="outline">Back to Reports</Button>
          </Link>
          <Link href="/citizen/reports/new">
            <Button>Report Another Issue</Button>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
