'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui';
import { reportService } from '@/lib/reportService';
import { workOrderService } from '@/lib/workOrderService';
import { REPORT_STATUS, WORKORDER_STATUS, CATEGORIES_LIST } from '@/lib/constants/sla';
import { getDepartmentName } from '@/lib/constants/departments';
import { getWardName } from '@/lib/constants/wards';

export default function OfficerDashboard() {
  const router = useRouter();
  const { userData, loading: authLoading } = useAuth();
  const [reports, setReports] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [reportStats, setReportStats] = useState({});
  const [woStats, setWoStats] = useState({});
  const [loading, setLoading] = useState(true);

  const isClassA = userData?.role === 'class_a';
  const isClassB = userData?.role === 'class_b';
  const isClassC = userData?.role === 'class_c';

  const navigation = [
    { name: 'Dashboard', href: '/officer/dashboard', icon: '📊' },
    { name: 'Reports', href: '/officer/reports', icon: '📋' },
    { name: 'Work Orders', href: '/officer/work-orders', icon: '🔧' },
    { name: 'Contractors', href: '/officer/contractors', icon: '👷' },
    { name: 'Infrastructure Map', href: '/map', icon: '🗺️' },
    { name: 'Route Optimizer', href: '/route', icon: '🛣️' },
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
      if (!userData?.role == "officer") {
        router.push('/auth/login');
        return;
      }
      loadData();
    }
  }, [userData, authLoading]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load based on officer level
      let reportsResult, workOrdersResult, statsResult, woStatsResult;

      if (isClassA) {
        // Class A sees everything
        reportsResult = await reportService.getAllReports({ limitCount: 10 });
        workOrdersResult = await workOrderService.getAllWorkOrders({ limitCount: 10 });
        statsResult = await reportService.getReportsStats();
        woStatsResult = await workOrderService.getWorkOrderStats();
      } else if (isClassB) {
        // Class B sees department-level
        reportsResult = await reportService.getAllReports({ limitCount: 10 });
        workOrdersResult = await workOrderService.getAllWorkOrders({ 
          department: userData.department,
          limitCount: 10 
        });
        statsResult = await reportService.getReportsStats();
        woStatsResult = await workOrderService.getWorkOrderStats(null, userData.department);
      } else {
        // Class C sees ward-level
        reportsResult = await reportService.getReportsByWard(userData.ward_id, { limitCount: 10 });
        workOrdersResult = await workOrderService.getWorkOrdersByWard(userData.ward_id, { limitCount: 10 });
        statsResult = await reportService.getReportsStats(userData.ward_id);
        woStatsResult = await workOrderService.getWorkOrderStats(userData.ward_id);
      }

      if (reportsResult.success) setReports(reportsResult.reports);
      if (workOrdersResult.success) setWorkOrders(workOrdersResult.work_orders);
      if (statsResult.success) setReportStats(statsResult.stats);
      if (woStatsResult.success) setWoStats(woStatsResult.stats);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
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

  const pendingValidation = reportStats.submitted || 0;
  const activeReports = (reportStats.accepted || 0) + (reportStats.assigned || 0) + (reportStats.in_progress || 0);
  const resolvedReports = (reportStats.completed || 0) + (reportStats.verified || 0) + (reportStats.closed || 0);
  const activeWorkOrders = (woStats.created || 0) + (woStats.assigned || 0) + (woStats.accepted || 0) + 
                          (woStats.en_route || 0) + (woStats.on_site || 0) + (woStats.in_progress || 0);

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
            <h1 className="text-2xl font-bold text-gray-900">Welcome, {userData?.name}!</h1>
            <p className="text-gray-600">
              {isClassC && `Ward: ${getWardName(userData.ward_id)}`}
              {isClassB && `Department: ${getDepartmentName(userData.department)}`}
              {isClassA && 'City-wide Overview'}
            </p>
          </div>
          <div className="flex space-x-3">
            <Link href="/officer/reports?status=submitted">
              <Button variant="warning">
                <span className="mr-2">⚠️</span>
                Pending Review ({pendingValidation})
              </Button>
            </Link>
            <Link href="/officer/work-orders/new">
              <Button>
                <span className="mr-2">➕</span>
                Create Work Order
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Pending Validation</p>
                  <p className="text-3xl font-bold text-yellow-600">{pendingValidation}</p>
                </div>
                <span className="text-4xl">⏳</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Active Reports</p>
                  <p className="text-3xl font-bold text-blue-600">{activeReports}</p>
                </div>
                <span className="text-4xl">📋</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Active Work Orders</p>
                  <p className="text-3xl font-bold text-orange-600">{activeWorkOrders}</p>
                </div>
                <span className="text-4xl">🔧</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-green-500">
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
        </div>

        {/* Alerts Section */}
        {pendingValidation > 0 && (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">⚠️</span>
                  <div>
                    <h3 className="font-semibold text-yellow-900">{pendingValidation} reports awaiting validation</h3>
                    <p className="text-sm text-yellow-700">Please review and validate citizen-submitted reports</p>
                  </div>
                </div>
                <Link href="/officer/reports?status=submitted">
                  <Button variant="warning">Review Now</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Reports */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Reports</CardTitle>
              <Link href="/officer/reports">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {reports.length === 0 ? (
                <div className="text-center py-8">
                  <span className="text-4xl">📭</span>
                  <p className="text-gray-500 mt-2">No reports in your area</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reports.slice(0, 5).map((report) => (
                    <Link
                      key={report.report_id}
                      href={`/officer/reports/${report.report_id}`}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">
                          {CATEGORIES_LIST.find(c => c.id === report.category)?.icon || '📋'}
                        </span>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{report.report_id}</p>
                          <p className="text-xs text-gray-500">
                            {CATEGORIES_LIST.find(c => c.id === report.category)?.name}
                          </p>
                        </div>
                      </div>
                      <Badge variant={getStatusBadgeVariant(report.status)} className="text-xs">
                        {report.status}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Work Orders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Work Orders</CardTitle>
              <Link href="/officer/work-orders">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {workOrders.length === 0 ? (
                <div className="text-center py-8">
                  <span className="text-4xl">📭</span>
                  <p className="text-gray-500 mt-2">No work orders yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {workOrders.slice(0, 5).map((wo) => (
                    <Link
                      key={wo.work_order_id}
                      href={`/officer/work-orders/${wo.work_order_id}`}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">
                          {CATEGORIES_LIST.find(c => c.id === wo.category)?.icon || '🔧'}
                        </span>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{wo.work_order_id}</p>
                          <p className="text-xs text-gray-500">
                            {wo.contractor_name || 'Unassigned'}
                          </p>
                        </div>
                      </div>
                      <Badge variant={getStatusBadgeVariant(wo.status)} className="text-xs">
                        {wo.status}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
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
              <Link href="/officer/reports?status=submitted" className="p-4 border rounded-lg hover:bg-gray-50 text-center">
                <span className="text-3xl">✅</span>
                <p className="text-sm text-gray-700 mt-2">Validate Reports</p>
              </Link>
              <Link href="/officer/work-orders/new" className="p-4 border rounded-lg hover:bg-gray-50 text-center">
                <span className="text-3xl">➕</span>
                <p className="text-sm text-gray-700 mt-2">Create Work Order</p>
              </Link>
              <Link href="/officer/contractors" className="p-4 border rounded-lg hover:bg-gray-50 text-center">
                <span className="text-3xl">👷</span>
                <p className="text-sm text-gray-700 mt-2">Manage Contractors</p>
              </Link>
              <Link href="/officer/analytics" className="p-4 border rounded-lg hover:bg-gray-50 text-center">
                <span className="text-3xl">📊</span>
                <p className="text-sm text-gray-700 mt-2">View Analytics</p>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
