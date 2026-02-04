'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Select, Input } from '@/components/ui';
import { reportService } from '@/lib/reportService';
import { REPORT_STATUS, CATEGORIES_LIST } from '@/lib/constants/sla';

const navigation = [
  { name: 'Dashboard', href: '/citizen/dashboard', icon: '📊' },
  { name: 'New Report', href: '/citizen/reports/new', icon: '📝' },
  { name: 'My Reports', href: '/citizen/reports', icon: '📋' },
  { name: 'Track Status', href: '/citizen/track', icon: '🔍' },
  { name: 'Infrastructure Map', href: '/map', icon: '🗺️' },
  { name: 'Route Optimizer', href: '/route', icon: '🛣️' },
  { name: 'Profile', href: '/citizen/profile', icon: '👤' },
];

export default function CitizenReportsPage() {
  const router = useRouter();
  const { userData, loading: authLoading } = useAuth();
  const [reports, setReports] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: 'all', category: 'all' });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (authLoading) {
      return; // Still loading auth
    }

    if (userData?.role !== 'citizen') {
      router.push('/auth/login');
      return;
    }

    loadReports();
  }, [userData, authLoading, router]);

  const loadReports = async () => {
    setLoading(true);
    try {
      // Load legacy reports
      const result = await reportService.getReportsByUser(userData.uid, { limitCount: 100 });
      if (result.success) {
        setReports(result.reports);
      }

      // Load new tickets using the API endpoint
      const userId = userData.id || userData.uid;
      const ticketsResponse = await fetch(
        `/api/tickets?userId=${userId}&role=citizen&filterType=my`
      );
      if (ticketsResponse.ok) {
        const ticketsData = await ticketsResponse.json();
        setTickets(ticketsData.tickets || []);
      }
    } catch (error) {
      console.error('Error loading reports and tickets:', error);
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

  const filteredReports = reports.filter(report => {
    const matchesStatus = filter.status === 'all' || report.status === filter.status;
    const matchesCategory = filter.category === 'all' || report.category === filter.category;
    const matchesSearch = !searchQuery || 
      report.report_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesCategory && matchesSearch;
  });

  // Filter tickets
  const filteredTickets = tickets.filter(ticket => {
    const matchesStatus = filter.status === 'all' || ticket.status === filter.status;
    const matchesSearch = !searchQuery || 
      ticket.ticket_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  // Combine and sort by creation date
  const allItems = [
    ...filteredReports.map(r => ({ ...r, type: 'report' })),
    ...filteredTickets.map(t => ({ ...t, type: 'ticket' }))
  ].sort((a, b) => {
    const dateA = a.created_at?.toDate ? a.created_at.toDate() : new Date(a.created_at);
    const dateB = b.created_at?.toDate ? b.created_at.toDate() : new Date(b.created_at);
    return dateB - dateA;
  });

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <DashboardLayout navigation={navigation} title="Citizen Portal">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Reports</h1>
            <p className="text-gray-600">View and track all your submitted reports</p>
          </div>
          <Link href="/citizen/reports/new">
            <Button>
              <span className="mr-2">➕</span>
              New Report
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                placeholder="Search by ID or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Select
                value={filter.status}
                onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
                options={[
                  { value: 'all', label: 'All Status' },
                  ...Object.entries(REPORT_STATUS).map(([key, val]) => ({
                    value: key.toLowerCase(),
                    label: val.name
                  }))
                ]}
              />
              <Select
                value={filter.category}
                onChange={(e) => setFilter(prev => ({ ...prev, category: e.target.value }))}
                options={[
                  { value: 'all', label: 'All Categories' },
                  ...CATEGORIES_LIST.map(cat => ({
                    value: cat.id,
                    label: cat.name
                  }))
                ]}
              />
              <Button
                variant="outline"
                onClick={() => {
                  setFilter({ status: 'all', category: 'all' });
                  setSearchQuery('');
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Reports and Tickets List */}
        <Card>
          <CardHeader>
            <CardTitle>
              Reports & Tickets ({allItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {allItems.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-6xl">📭</span>
                <h3 className="text-lg font-medium text-gray-900 mt-4">No reports or tickets found</h3>
                <p className="text-gray-500 mt-2">
                  {reports.length === 0 && tickets.length === 0
                    ? "You haven't submitted any reports or tickets yet" 
                    : "No items match your current filters"}
                </p>
                {reports.length === 0 && tickets.length === 0 && (
                  <Link href="/citizen/reports/new">
                    <Button className="mt-4">Submit Your First Report</Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {allItems.map((item) => (
                  <Link
                    key={item.report_id || item.ticket_id}
                    href={item.type === 'report' 
                      ? `/citizen/reports/${item.report_id}`
                      : `/citizen/reports/ticket/${item.ticket_id}`
                    }
                    className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        {item.type === 'report' ? (
                          <>
                            <span className="text-3xl">
                              {CATEGORIES_LIST.find(c => c.id === item.category)?.icon || '📋'}
                            </span>
                            <div>
                              <div className="flex items-center space-x-2">
                                <h3 className="font-semibold text-gray-900">{item.report_id}</h3>
                                <Badge variant={getStatusBadgeVariant(item.status)}>
                                  {REPORT_STATUS[item.status.toUpperCase()]?.name || item.status}
                                </Badge>
                                <Badge variant="outline">Report</Badge>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {CATEGORIES_LIST.find(c => c.id === item.category)?.name || item.category}
                              </p>
                              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                {item.description}
                              </p>
                              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                                <span>📅 {formatDate(item.created_at)}</span>
                                {item.location?.address && (
                                  <span>📍 {item.location.address.substring(0, 50)}...</span>
                                )}
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <span className="text-3xl">🎫</span>
                            <div>
                              <div className="flex items-center space-x-2">
                                <h3 className="font-semibold text-gray-900">{item.ticket_id}</h3>
                                <Badge variant={
                                  item.status === 'submitted' ? 'warning' :
                                  item.status === 'resolved' ? 'success' :
                                  'secondary'
                                }>
                                  {item.status}
                                </Badge>
                                <Badge variant="outline">Ticket</Badge>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {item.issue_type} • {item.department}
                              </p>
                              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                {item.title}
                              </p>
                              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                                <span>📅 {formatDate(item.created_at)}</span>
                                <span>🏷️ {item.severity_level}</span>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                      <span className="text-gray-400 text-xl">→</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
