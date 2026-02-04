'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Select, Input } from '@/components/ui';
import { reportService } from '@/lib/reportService';
import { REPORT_STATUS, CATEGORIES_LIST } from '@/lib/constants/sla';
import { getDepartmentName } from '@/lib/constants/departments';
import { getWardName } from '@/lib/constants/wards';

export default function OfficerReportsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userData, loading: authLoading } = useAuth();
  const [reports, setReports] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    status: searchParams.get('status') || 'all',
    category: 'all',
    priority: 'all'
  });
  const [searchQuery, setSearchQuery] = useState('');

  const isClassA = userData?.role === 'class_a';
  const isClassB = userData?.role === 'class_b';
  const isClassC = userData?.role === 'class_c';

  const navigation = [
    { name: 'Dashboard', href: '/officer/dashboard', icon: '📊' },
    { name: 'Reports', href: '/officer/reports', icon: '📋' },
    { name: 'Tickets', href: '/officer/tickets', icon: '🎫' },
    { name: 'Work Orders', href: '/officer/work-orders', icon: '🔧' },
    { name: 'Contractors', href: '/officer/contractors', icon: '👷' },
    { name: 'Assets', href: '/officer/assets', icon: '🏗️' },
    { name: 'Analytics', href: '/officer/analytics', icon: '📈' },
    ...(isClassB || isClassA ? [
      { name: 'Team', href: '/officer/team', icon: '👥' },
      { name: 'Budgets', href: '/officer/budgets', icon: '💰' },
    ] : []),
    { name: 'Profile', href: '/officer/profile', icon: '👤' },
  ];

  useEffect(() => {
    if (!authLoading) {
      if (userData.role != 'officer') {
        router.push('/auth/login');
        return;
      }
      loadReports();
    }
  }, [userData, authLoading]);

  const loadReports = async () => {
    setLoading(true);
    try {
      let result;

      if (isClassA) {
        result = await reportService.getAllReports();
      } else if (isClassB) {
        result = await reportService.getAllReports({ limitCount: 200 });
      } else {
        result = await reportService.getReportsByWard(userData.ward_id, { limitCount: 200 });
      }

      if (result.success) {
        setReports(result.reports);
      }

    
    } catch (error) {
      console.error('Error loading reports and tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleValidateReport = async (reportId, isValid) => {
    try {
      const newStatus = isValid ? 'accepted' : 'rejected';
      const result = await reportService.updateReportStatus(
        reportId,
        newStatus,
        userData.uid,
        isValid ? 'Report validated by officer' : 'Report rejected by officer'
      );

      if (result.success) {
        loadReports();
      }
    } catch (error) {
      console.error('Error validating report:', error);
    }
  };

  const getStatusBadgeVariant = (status) => {
    const variants = {
      submitted: 'warning',
      accepted: 'info',
      assigned: 'primary',
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
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredReports = reports.filter(report => {
    const matchesStatus = filter.status === 'all' || report.status === filter.status;
    const matchesCategory = filter.category === 'all' || report.category === filter.category;
    const matchesPriority = filter.priority === 'all' || report.priority === filter.priority;
    const matchesSearch = !searchQuery || 
      report.report_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesCategory && matchesPriority && matchesSearch;
  });

  // Filter tickets for class_a
  const filteredTickets = tickets.filter(ticket => {
    const matchesStatus = filter.status === 'all' || ticket.status === filter.status;
    const matchesSearch = !searchQuery || 
      ticket.ticket_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <DashboardLayout navigation={navigation} title={`${userData?.role?.replace('_', ' ').toUpperCase()} Officer`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports Management</h1>
            <p className="text-gray-600">
              {isClassC && `Ward: ${getWardName(userData.ward_id)}`}
              {isClassB && `Department: ${getDepartmentName(userData.department)}`}
              {isClassA && 'All Reports'}
            </p>
          </div>
          <div className="flex space-x-3">
            <Button
              variant={filter.status === 'submitted' ? 'warning' : 'outline'}
              onClick={() => setFilter(prev => ({ ...prev, status: 'submitted' }))}
            >
              ⚠️ Pending ({reports.filter(r => r.status === 'submitted').length})
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Input
                placeholder="Search by ID..."
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
              <Select
                value={filter.priority}
                onChange={(e) => setFilter(prev => ({ ...prev, priority: e.target.value }))}
                options={[
                  { value: 'all', label: 'All Priority' },
                  { value: 'emergency', label: 'Emergency' },
                  { value: 'high', label: 'High' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'low', label: 'Low' }
                ]}
              />
              <Button
                variant="outline"
                onClick={() => {
                  setFilter({ status: 'all', category: 'all', priority: 'all' });
                  setSearchQuery('');
                }}
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Reports and Tickets List */}
        <Card>
          <CardHeader>
            <CardTitle>
              {isClassA 
                ? `Reports & Tickets (${filteredReports.length + filteredTickets.length})` 
                : `Reports (${filteredReports.length})`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredReports.length === 0 && filteredTickets.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-6xl">📭</span>
                <h3 className="text-lg font-medium text-gray-900 mt-4">No items found</h3>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Reports Section */}
                {filteredReports.map((report) => (
                  <div
                    key={report.report_id}
                    className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4 flex-1">
                            <span className="text-3xl">
                              {CATEGORIES_LIST.find(c => c.id === report.category)?.icon || '📋'}
                            </span>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 flex-wrap gap-1">
                                <Link href={`/officer/reports/${report.report_id}`}>
                                  <h3 className="font-semibold text-gray-900 hover:text-blue-600">
                                    {report.report_id}
                                  </h3>
                                </Link>
                                <Badge variant="outline">Report</Badge>
                                <Badge variant={getStatusBadgeVariant(report.status)}>
                                  {report.status}
                                </Badge>
                                <Badge variant={report.priority === 'emergency' ? 'danger' : 'secondary'}>
                                  {report.priority}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {CATEGORIES_LIST.find(c => c.id === report.category)?.name}
                              </p>
                              <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                                {report.description}
                              </p>
                              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                                <span>📅 {formatDate(report.created_at)}</span>
                                <span>📍 {getWardName(report.ward_id)}</span>
                                <span>👤 {report.reporter_name}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col space-y-2 ml-4">
                            {report.status === 'submitted' && (
                              <>
                                <Button
                                  variant="success"
                                  size="sm"
                                  onClick={() => handleValidateReport(report.report_id, true)}
                                >
                                  ✅ Accept
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleValidateReport(report.report_id, false)}
                                >
                                  ❌ Reject
                                </Button>
                              </>
                            )}
                            {report.status === 'accepted' && (
                              <Link href={`/officer/work-orders/new?report=${report.report_id}`}>
                                <Button size="sm">
                                  🔧 Create WO
                                </Button>
                              </Link>
                            )}
                            <Link href={`/officer/reports/${report.report_id}`}>
                              <Button variant="outline" size="sm" className="w-full">
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
                {/* Tickets Section */}
                {isClassA && filteredTickets.length > 0 && filteredTickets.map((ticket) => (
                  <div key={ticket.ticket_id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-blue-600">🎫 Ticket</span>
                          <span className="text-xs font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {ticket.ticket_id}
                          </span>
                          <span className={`text-xs font-medium px-2 py-1 rounded ${
                            ticket.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            ticket.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                            ticket.status === 'in_progress' ? 'bg-purple-100 text-purple-800' :
                            ticket.status === 'resolved' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {ticket.status?.charAt(0).toUpperCase() + ticket.status?.slice(1)}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">{ticket.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">{ticket.description}</p>
                        <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                          {ticket.issue_type && <span>📋 {ticket.issue_type}</span>}
                          {ticket.department && <span>🏢 {ticket.department}</span>}
                          {ticket.severity_level && (
                            <span className={
                              ticket.severity_level === 'high' ? 'text-red-600' :
                              ticket.severity_level === 'medium' ? 'text-orange-600' :
                              'text-green-600'
                            }>
                              ⚠️ {ticket.severity_level}
                            </span>
                          )}
                          {ticket.citizen_name && <span>👤 {ticket.citizen_name}</span>}
                          <span>📅 {new Date(ticket.created_at?.toDate?.() || ticket.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/officer/tickets/${ticket.ticket_id}`}>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </Link>
                      </div>
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
