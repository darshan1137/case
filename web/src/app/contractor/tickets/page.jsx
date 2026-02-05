'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui';

const navigation = [
  { name: 'Dashboard', href: '/contractor/dashboard', icon: '📊' },
  { name: 'Assigned Tickets', href: '/contractor/tickets', icon: '🎫' },
  { name: 'Jobs', href: '/contractor/jobs', icon: '📋' },
  { name: 'Profile', href: '/contractor/profile', icon: '👤' },
  { name: 'Change Password', href: '/contractor/change-password', icon: '🔐' },
];

export default function ContractorTicketsPage() {
  const router = useRouter();
  const { userData, loading: authLoading } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (authLoading) return;

    if (userData?.role !== 'contractor') {
      router.push('/auth/login');
      return;
    }
  }, [userData, authLoading, router]);

  useEffect(() => {
    if (userData) {
      loadTickets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData, searchTerm, statusFilter]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const userId = userData.id || userData.uid;
      
      // Build query params
      const params = new URLSearchParams({
        userId: userId,
        role: 'contractor',
      });

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      if (statusFilter) {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/tickets?${params.toString()}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to load tickets');
      }

      const data = await response.json();
      setTickets(data.tickets || []);
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityBadgeColor = (severity) => {
    switch (severity) {
      case 'dangerous':
      case 'critical':
        return 'danger';
      case 'high':
        return 'warning';
      case 'moderate':
      case 'medium':
        return 'info';
      default:
        return 'secondary';
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'pending':
      case 'assigned':
        return 'warning';
      case 'in_progress':
        return 'info';
      case 'resolved':
        return 'success';
      case 'rejected':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <DashboardLayout navigation={navigation}>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assigned Tickets</h1>
          <p className="text-gray-600 mt-1">View and manage tickets assigned to you</p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                placeholder="Search tickets by title, issue type, ticket ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">All Statuses</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Tickets List */}
        <Card>
          <CardHeader>
            <CardTitle>Tickets ({tickets.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-6xl mb-4 block">🎫</span>
                <p className="text-gray-500 text-lg">
                  {searchTerm || statusFilter
                    ? 'No tickets match your filters'
                    : 'No tickets assigned to you yet'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {tickets.map((ticket) => (
                  <div key={ticket.ticket_id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                    {/* Header with title and badges */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-gray-900 text-lg">{ticket.title}</h3>
                          <Badge variant={getStatusBadgeColor(ticket.status)}>
                            {ticket.status}
                          </Badge>
                        </div>
                        <p className="text-gray-600">{ticket.description}</p>
                      </div>
                      <Badge variant={getSeverityBadgeColor(ticket.severity_level)} className="ml-4">
                        {ticket.severity_level}
                      </Badge>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3 text-sm">
                      <div className="bg-gray-50 p-3 rounded">
                        <span className="text-gray-600">Issue Type:</span>
                        <p className="font-medium text-gray-900">{ticket.issue_type}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <span className="text-gray-600">Department:</span>
                        <p className="font-medium text-gray-900">{ticket.department}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <span className="text-gray-600">Assigned:</span>
                        <p className="font-medium text-gray-900">
                          {ticket.assigned_at 
                            ? new Date(ticket.assigned_at?.toDate?.() || ticket.assigned_at).toLocaleDateString()
                            : 'N/A'}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <span className="text-gray-600">Citizen:</span>
                        <p className="font-medium text-gray-900">{ticket.citizen_name || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Images */}
                    {ticket.images && ticket.images.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-600 mb-2">Images:</p>
                        <div className="flex gap-2 overflow-x-auto">
                          {ticket.images.map((imageUrl, idx) => (
                            <div key={idx} className="relative w-24 h-24 flex-shrink-0 rounded overflow-hidden border border-gray-200">
                              <img
                                src={imageUrl}
                                alt={`Ticket image ${idx + 1}`}
                                className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform"
                                onClick={() => window.open(imageUrl, '_blank')}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200 text-xs text-gray-600">
                      <div className="flex gap-4">
                        <span>ID: {ticket.ticket_id}</span>
                        <span>Created: {new Date(ticket.created_at?.toDate?.() || ticket.created_at).toLocaleDateString()}</span>
                      </div>
                      <Link href={`/contractor/tickets/${ticket.ticket_id}`}>
                        <button className="text-blue-600 hover:text-blue-700 font-medium">
                          View Details →
                        </button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
