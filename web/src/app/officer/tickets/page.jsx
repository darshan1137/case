'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui';


export default function OfficerTicketsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userData, loading: authLoading } = useAuth();

  const isClassA = userData?.officer_class === 'class_a';
  const isClassB = userData?.officer_class === 'class_b';
  const isClassC = userData?.officer_class === 'class_c';



   const navigation = [
    { name: 'Dashboard', href: '/officer/dashboard', icon: '📊' },
    { name: 'Reports', href: '/officer/reports', icon: '📋' },
    { name: 'Tickets', href: '/officer/tickets', icon: '🎫' },
    { name: 'Work Orders', href: '/officer/work-orders', icon: '🔧' },
    { name: 'Contractors', href: '/officer/contractors', icon: '👷' },
    ...(isClassA ? [
      { name: '➕ Add Contractor', href: '/officer/contractors/add', icon: '➕' },
    ] : []),
    { name: 'Assets', href: '/officer/assets', icon: '🏗️' },
    { name: 'Analytics', href: '/officer/analytics', icon: '📈' },
    ...(isClassB || isClassA ? [
      { name: 'Team', href: '/officer/team', icon: '👥' },
      { name: 'Budgets', href: '/officer/budgets', icon: '💰' },
    ] : []),
    { name: 'Profile', href: '/officer/profile', icon: '👤' },
  ];
  
  const [tickets, setTickets] = useState([]);
  const [assignedTickets, setAssignedTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeTab, setActiveTab] = useState('all');

 
  useEffect(() => {
    if (!authLoading && userData.role == "citizen") {
      router.push('/auth/login');
    }
  }, [userData, authLoading, router]);

  useEffect(() => {
    if (userData) {
      loadTickets();
    }
  }, [userData, searchTerm, statusFilter, activeTab]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const userId = userData.id || userData.uid;
      
      // Build query params
      const params = new URLSearchParams({
        userId: userId,
        role: userData.officer_class || 'class_a',
      });

      if ((isClassB || isClassC) && userData.ward_id) {
        params.append('ward', userData.ward_id);
      }

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      if (statusFilter) {
        params.append('status', statusFilter);
      }

      // Fetch all tickets
      const response = await fetch(`/api/tickets?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        console.log(data)
        setTickets(data.tickets || []);

        // If class_b, also fetch assigned tickets
        if (isClassB) {
          const assignedParams = new URLSearchParams({
            userId: userId,
            role: userData.officer_class || 'class_b',
            filterType: 'assigned',
            ward: userData.ward_id || ''
          });
          
          const assignedResponse = await fetch(`/api/tickets?${assignedParams.toString()}`);
          if (assignedResponse.ok) {
            const assignedData = await assignedResponse.json();
            setAssignedTickets(assignedData.tickets || []);
          }
        }
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityBadgeColor = (severity) => {
    switch (severity) {
      case 'dangerous':
        return 'danger';
      case 'high':
        return 'warning';
      case 'moderate':
        return 'info';
      default:
        return 'secondary';
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'submitted':
        return 'warning';
      case 'resolved':
        return 'success';
      case 'rejected':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const displayTickets = activeTab === 'assigned' ? assignedTickets : tickets;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <DashboardLayout navigation={navigation} title="Tickets">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Citizen Tickets</h1>
          <p className="text-gray-600 mt-1">AI-detected infrastructure issues from citizen reports</p>
        </div>

        {/* Tabs for Class B */}
        {isClassB && (
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              All Tickets ({tickets.length})
            </button>
            <button
              onClick={() => setActiveTab('assigned')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'assigned'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Assigned to Me ({assignedTickets.length})
            </button>
          </div>
        )}

        {/* Filters and Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                placeholder="Search tickets by title, issue type, ticket ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                <option value="submitted">Submitted</option>
                <option value="resolved">Resolved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Tickets List */}
        <Card>
          <CardHeader>
            <CardTitle>
              {activeTab === 'assigned' ? 'Assigned Tickets' : 'All Tickets'} ({displayTickets.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {displayTickets.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-6xl">🎫</span>
                <p className="text-gray-500 mt-4">
                  {searchTerm || statusFilter
                    ? 'No tickets match your filters'
                    : 'No tickets available'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {displayTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="border rounded-lg p-4 hover:shadow-lg transition-shadow"
                  >
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

                    {/* Metadata */}
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
                        <span className="text-gray-600">Confidence:</span>
                        <p className="font-medium text-gray-900">{(ticket.confidence_score * 100).toFixed(0)}%</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <span className="text-gray-600">Reported by:</span>
                        <p className="font-medium text-gray-900">{ticket.reporter_name}</p>
                      </div>
                    </div>

                    {/* Images */}
                    {ticket.images && ticket.images.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-600 mb-2">Images:</p>
                        <div className="flex gap-2 overflow-x-auto">
                          {ticket.images.map((imageUrl, idx) => (
                            <div
                              key={idx}
                              className="relative w-24 h-24 flex-shrink-0 rounded overflow-hidden border border-gray-200"
                            >
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
                        <span>Created: {new Date(ticket.created_at).toLocaleDateString()}</span>
                      </div>
                      <Link href={`/officer/tickets/${ticket.ticket_id}`}>
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
