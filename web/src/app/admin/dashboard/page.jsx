'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui';
import { reportService } from '@/lib/reportService';
import { workOrderService } from '@/lib/workOrderService';
import { userService } from '@/lib/userService';
import { DEPARTMENTS_LIST, getDepartmentName } from '@/lib/constants/departments';
import { WARDS_LIST } from '@/lib/constants/wards';

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
  { name: 'Reports', href: '/admin/reports', icon: '📋' },
  { name: 'Work Orders', href: '/admin/work-orders', icon: '🔧' },
  { name: 'Users', href: '/admin/users', icon: '👥' },
  { name: 'Contractors', href: '/admin/contractors', icon: '👷' },
  { name: 'Departments', href: '/admin/departments', icon: '🏛️' },
  { name: 'Infrastructure Map', href: '/map', icon: '🌍' },
  { name: 'Route Optimizer', href: '/route', icon: '🛣️' },
  { name: 'Assets', href: '/admin/assets', icon: '🏗️' },
  { name: 'Analytics', href: '/admin/analytics', icon: '📈' },
  { name: 'SLA Config', href: '/admin/sla', icon: '⏱️' },
  { name: 'Audit Logs', href: '/admin/audit', icon: '📝' },
  { name: 'Settings', href: '/admin/settings', icon: '⚙️' },
];

export default function AdminDashboard() {
  const router = useRouter();
  const { userData, loading: authLoading } = useAuth();
  const [reportStats, setReportStats] = useState({});
  const [woStats, setWoStats] = useState({});
  const [userStats, setUserStats] = useState({});
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
      return; // Still loading auth, don't redirect yet
    }

    // Auth finished loading - now check if user has correct role
    if (userData?.role !== 'class_a') {
      router.push('/auth/login');
      return;
    }

    // User is authenticated with correct role
    loadData();
  }, [userData, authLoading, router]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load all stats
      const [reportsResult, woResult, usersResult] = await Promise.all([
        reportService.getReportsStats(),
        workOrderService.getWorkOrderStats(),
        userService.getAllUsers(100)
      ]);

      if (reportsResult.success) setReportStats(reportsResult.stats);
      if (woResult.success) setWoStats(woResult.stats);
      
      if (usersResult.success) {
        // Calculate user stats
        const stats = {};
        const pending = [];
        usersResult.users.forEach(user => {
          stats[user.role] = (stats[user.role] || 0) + 1;
          if (!user.active || user.verified === false) {
            pending.push(user);
          }
        });
        setUserStats(stats);
        setPendingUsers(pending.slice(0, 5));
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalReports = Object.values(reportStats).reduce((a, b) => a + b, 0);
  const totalWorkOrders = Object.values(woStats).reduce((a, b) => a + b, 0);
  const totalUsers = Object.values(userStats).reduce((a, b) => a + b, 0);
  const pendingValidation = reportStats.submitted || 0;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <DashboardLayout navigation={navigation} title="Admin Panel (Class A)">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">City Administration Dashboard</h1>
            <p className="text-gray-600">Complete oversight and management of city infrastructure</p>
          </div>
          <div className="flex space-x-3">
            <Link href="/admin/reports/export">
              <Button variant="outline">
                <span className="mr-2">📤</span>
                Export Reports
              </Button>
            </Link>
            <Link href="/admin/sla">
              <Button>
                <span className="mr-2">⚙️</span>
                Configure SLA
              </Button>
            </Link>
          </div>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Total Reports</p>
                  <p className="text-3xl font-bold">{totalReports}</p>
                </div>
                <span className="text-4xl opacity-80">📊</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Work Orders</p>
                  <p className="text-3xl font-bold">{totalWorkOrders}</p>
                </div>
                <span className="text-4xl opacity-80">🔧</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Total Users</p>
                  <p className="text-3xl font-bold">{totalUsers}</p>
                </div>
                <span className="text-4xl opacity-80">👥</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Departments</p>
                  <p className="text-3xl font-bold">{DEPARTMENTS_LIST.length}</p>
                </div>
                <span className="text-4xl opacity-80">🏛️</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        {(pendingValidation > 0 || pendingUsers.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingValidation > 0 && (
              <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl">⚠️</span>
                      <div>
                        <h3 className="font-semibold text-yellow-900">{pendingValidation} reports pending</h3>
                        <p className="text-sm text-yellow-700">Awaiting validation</p>
                      </div>
                    </div>
                    <Link href="/admin/reports?status=submitted">
                      <Button variant="warning" size="sm">Review</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {pendingUsers.length > 0 && (
              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl">👤</span>
                      <div>
                        <h3 className="font-semibold text-purple-900">{pendingUsers.length} users pending</h3>
                        <p className="text-sm text-purple-700">Awaiting verification</p>
                      </div>
                    </div>
                    <Link href="/admin/users?status=pending">
                      <Button variant="secondary" size="sm">Review</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>User Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">👤</span>
                    <span className="font-medium">Citizens</span>
                  </div>
                  <Badge variant="success">{userStats.citizen || 0}</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">👷</span>
                    <span className="font-medium">Contractors</span>
                  </div>
                  <Badge variant="warning">{userStats.contractor || 0}</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">👔</span>
                    <span className="font-medium">Class C Officers</span>
                  </div>
                  <Badge variant="info">{userStats.class_c || 0}</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🎖️</span>
                    <span className="font-medium">Class B Officers</span>
                  </div>
                  <Badge variant="primary">{userStats.class_b || 0}</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">👑</span>
                    <span className="font-medium">Class A Officers</span>
                  </div>
                  <Badge variant="danger">{userStats.class_a || 0}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Department Overview */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Departments</CardTitle>
              <Link href="/admin/departments">
                <Button variant="outline" size="sm">Manage</Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
                {DEPARTMENTS_LIST.slice(0, 10).map((dept) => (
                  <Link
                    key={dept.id}
                    href={`/admin/departments/${dept.id}`}
                    className="p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <p className="font-medium text-sm text-gray-900">{dept.code}</p>
                    <p className="text-xs text-gray-500 truncate">{dept.name}</p>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Grid */}
        <Card>
          <CardHeader>
            <CardTitle>Administration Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <Link href="/admin/users/new" className="p-4 border rounded-lg hover:bg-gray-50 text-center">
                <span className="text-3xl">👤</span>
                <p className="text-sm text-gray-700 mt-2">Add User</p>
              </Link>
              <Link href="/admin/contractors/pending" className="p-4 border rounded-lg hover:bg-gray-50 text-center">
                <span className="text-3xl">✅</span>
                <p className="text-sm text-gray-700 mt-2">Verify Contractors</p>
              </Link>
              <Link href="/admin/analytics" className="p-4 border rounded-lg hover:bg-gray-50 text-center">
                <span className="text-3xl">📈</span>
                <p className="text-sm text-gray-700 mt-2">City Analytics</p>
              </Link>
              <Link href="/admin/sla" className="p-4 border rounded-lg hover:bg-gray-50 text-center">
                <span className="text-3xl">⏱️</span>
                <p className="text-sm text-gray-700 mt-2">SLA Config</p>
              </Link>
              <Link href="/admin/audit" className="p-4 border rounded-lg hover:bg-gray-50 text-center">
                <span className="text-3xl">📝</span>
                <p className="text-sm text-gray-700 mt-2">Audit Logs</p>
              </Link>
              <Link href="/admin/settings" className="p-4 border rounded-lg hover:bg-gray-50 text-center">
                <span className="text-3xl">⚙️</span>
                <p className="text-sm text-gray-700 mt-2">Settings</p>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Pending Users */}
        {pendingUsers.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Pending User Verification</CardTitle>
              <Link href="/admin/users?status=pending">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <span className="text-2xl">
                        {user.role === 'contractor' ? '👷' : '👔'}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500">
                          {user.role.replace('_', ' ')} • {user.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="success" size="sm">Approve</Button>
                      <Button variant="destructive" size="sm">Reject</Button>
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
