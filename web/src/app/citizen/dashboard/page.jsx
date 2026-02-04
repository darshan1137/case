'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui';
import { reportService } from '@/lib/reportService';
import { REPORT_STATUS, CATEGORIES_LIST } from '@/lib/constants/sla';
import Image from 'next/image';

const navigation = [
  { name: 'Dashboard', href: '/citizen/dashboard', icon: '📊' },
  { name: 'New Report', href: '/citizen/reports/new', icon: '📝' },
  { name: 'My Reports', href: '/citizen/reports', icon: '📋' },
  { name: 'Track Status', href: '/citizen/track', icon: '🔍' },
  { name: 'Infrastructure Map', href: '/map', icon: '🗺️' },
  { name: 'Route Optimizer', href: '/route', icon: '🛣️' },
  { name: 'Profile', href: '/citizen/profile', icon: '👤' },
];

export default function CitizenDashboard() {
  const router = useRouter();
  const { userData, loading: authLoading } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
      return; // Still loading auth
    }

    // Only proceed if auth is done loading
    if (!userData) {
      // Auth finished loading and no user - wait a bit for userData to populate
      return;
    }

    if (userData.role !== 'citizen') {
      // Wrong role
      router.push('/auth/login');
      return;
    }

    // User is authenticated and has correct role
    loadData();
  }, [userData, authLoading, router]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load user's tickets (from new ticket creation)
      const userId = userData.id || userData.uid;
      const ticketsResponse = await fetch(
        `/api/tickets?userId=${userId}&role=citizen&filterType=my`
      );
      if (ticketsResponse.ok) {
        const ticketsData = await ticketsResponse.json();
        setTickets(ticketsData.tickets || []);
      }

      // Load user's recent reports (legacy reports)
      const reportsResult = await reportService.getReportsByUser(userData.uid, { limitCount: 5 });
      if (reportsResult.success) {
        setReports(reportsResult.reports);
      }

      // Calculate stats
      const allReportsResult = await reportService.getReportsByUser(userData.uid, { limitCount: 100 });
      if (allReportsResult.success) {
        const statusCounts = {};
        allReportsResult.reports.forEach(report => {
          statusCounts[report.status] = (statusCounts[report.status] || 0) + 1;
        });
        setStats(statusCounts);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
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

  const totalReports = Object.values(stats).reduce((a, b) => a + b, 0);
  const openReports = (stats.submitted || 0) + (stats.accepted || 0) + (stats.assigned || 0) + (stats.in_progress || 0);
  const resolvedReports = (stats.completed || 0) + (stats.verified || 0) + (stats.closed || 0);

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
        {/* Welcome Section */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome, {userData?.name}!</h1>
            <p className="text-gray-600">Track your civic reports and submit new issues</p>
          </div>
          <Link href="/citizen/reports/new">
            <Button>
              <span className="mr-2">➕</span>
              Report New Issue
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Reports</p>
                  <p className="text-3xl font-bold text-gray-900">{totalReports}</p>
                </div>
                <span className="text-4xl">📊</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Open Issues</p>
                  <p className="text-3xl font-bold text-yellow-600">{openReports}</p>
                </div>
                <span className="text-4xl">⏳</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Resolved</p>
                  <p className="text-3xl font-bold text-green-600">{resolvedReports}</p>
                </div>
                <span className="text-4xl">✅</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Daily Limit</p>
                  <p className="text-3xl font-bold text-blue-600">10</p>
                </div>
                <span className="text-4xl">📝</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {CATEGORIES_LIST.slice(0, 8).map((category) => (
                <Link 
                  key={category.id}
                  href={`/citizen/reports/new?category=${category.id}`}
                  className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="text-3xl mb-2">{category.icon}</span>
                  <span className="text-sm text-gray-700 text-center">{category.name}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Tickets */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Your Recent Tickets</CardTitle>
            <Link href="/citizen/reports">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {tickets.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-4xl">🎫</span>
                <p className="text-gray-500 mt-2">No tickets yet. Create your first report!</p>
                <Link href="/citizen/reports/new">
                  <Button className="mt-4">Create Your First Ticket</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {tickets.slice(0, 5).map((ticket) => (
                  <div
                    key={ticket.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{ticket.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{ticket.description}</p>
                      </div>
                      <Badge className="ml-4">
                        {ticket.severity_level}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between mb-3">
                      <div className="flex gap-2 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          🏷️ {ticket.issue_type}
                        </span>
                        <span className="flex items-center gap-1">
                          🏢 {ticket.department}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Image Preview */}
                    {ticket.images && ticket.images.length > 0 && (
                      <div className="mb-3 flex gap-2 overflow-x-auto">
                        {ticket.images.map((imageUrl, idx) => (
                          <div
                            key={idx}
                            className="relative w-20 h-20 flex-shrink-0 rounded overflow-hidden"
                          >
                            <img
                              src={imageUrl}
                              alt={`Ticket image ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <span className="text-gray-600">ID: </span>
                        <span className="font-mono text-gray-900">{ticket.ticket_id}</span>
                      </div>
                      <Badge variant={
                        ticket.status === 'submitted' ? 'warning' :
                        ticket.status === 'resolved' ? 'success' :
                        'secondary'
                      }>
                        {ticket.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Reports */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Reports</CardTitle>
            <Link href="/citizen/reports">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {reports.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-4xl">📭</span>
                <p className="text-gray-500 mt-2">No reports yet. Start by reporting an issue!</p>
                <Link href="/citizen/reports/new">
                  <Button className="mt-4">Report Your First Issue</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map((report) => (
                  <Link
                    key={report.report_id}
                    href={`/citizen/reports/${report.report_id}`}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <span className="text-2xl">
                        {CATEGORIES_LIST.find(c => c.id === report.category)?.icon || '📋'}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">
                          {report.report_id}
                        </p>
                        <p className="text-sm text-gray-500">
                          {CATEGORIES_LIST.find(c => c.id === report.category)?.name || report.category}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge variant={getStatusBadgeVariant(report.status)}>
                        {REPORT_STATUS[report.status.toUpperCase()]?.name || report.status}
                      </Badge>
                      <span className="text-gray-400">→</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tips Section */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-blue-900 mb-2">💡 Tips for Better Reports</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Take clear photos with good lighting</li>
              <li>• Enable location services for accurate pinpointing</li>
              <li>• Provide detailed descriptions of the issue</li>
              <li>• Check for existing reports nearby before submitting</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
