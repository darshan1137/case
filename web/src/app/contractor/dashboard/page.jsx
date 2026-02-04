'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui';
import { workOrderService } from '@/lib/workOrderService';
import { WORKORDER_STATUS, CATEGORIES_LIST } from '@/lib/constants/sla';
import ContractorTour from '@/components/ContractorTour';
import TourButton from '@/components/TourButton';

const navigation = [
  { name: 'Dashboard', href: '/contractor/dashboard', icon: '📊' },
  { name: 'Assigned Tickets', href: '/contractor/tickets', icon: '📋' },
  { name: 'Active Jobs', href: '/contractor/jobs/active', icon: '🔨' },
  { name: 'Completed', href: '/contractor/jobs/completed', icon: '✅' },
  { name: 'Infrastructure Map', href: '/map', icon: '🗺️' },
  { name: 'Route Optimizer', href: '/route', icon: '🛣️' },
  { name: 'Performance', href: '/contractor/performance', icon: '📈' },
  { name: 'Profile', href: '/contractor/profile', icon: '👤' },
];

export default function ContractorDashboard() {
  const router = useRouter();
  const { userData, loading: authLoading } = useAuth();
  const [workOrders, setWorkOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [runTour, setRunTour] = useState(false);

  useEffect(() => {
    if (authLoading) {
      return; // Still loading auth, don't redirect yet
    }

    // Auth finished loading - now check if user has correct role
    if (userData?.role !== 'contractor') {
      router.push('/auth/login');
      return;
    }

    // User is authenticated with correct role
    loadData();
    
    // Check if user has seen the tour
    const tourCompleted = localStorage.getItem('contractorTourCompleted');
    if (!tourCompleted) {
      // Start tour after a brief delay
      setTimeout(() => setRunTour(true), 1000);
    }
  }, [userData, authLoading, router]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load contractor's work orders
      const result = await workOrderService.getWorkOrdersByContractor(userData.uid);
      if (result.success) {
        setWorkOrders(result.work_orders.slice(0, 5));
        
        // Calculate stats
        const statusCounts = {};
        result.work_orders.forEach(wo => {
          statusCounts[wo.status] = (statusCounts[wo.status] || 0) + 1;
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
      created: 'secondary',
      assigned: 'info',
      accepted: 'primary',
      en_route: 'warning',
      on_site: 'warning',
      in_progress: 'warning',
      completed: 'success',
      verified: 'success',
      closed: 'default',
      rejected: 'danger',
      delayed: 'danger'
    };
    return variants[status] || 'default';
  };

  const pendingJobs = (stats.assigned || 0);
  const activeJobs = (stats.accepted || 0) + (stats.en_route || 0) + (stats.on_site || 0) + (stats.in_progress || 0);
  const completedJobs = (stats.completed || 0) + (stats.verified || 0) + (stats.closed || 0);
  const totalJobs = Object.values(stats).reduce((a, b) => a + b, 0);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <DashboardLayout navigation={navigation} title="Contractor Portal">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome, {userData?.name}!</h1>
            <p className="text-gray-600">Manage your assigned work orders</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-yellow-500 text-xl">⭐</span>
            <span className="text-lg font-semibold">{userData?.rating?.toFixed(1) || '0.0'}</span>
            <span className="text-gray-500">Rating</span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Pending Jobs</p>
                  <p className="text-3xl font-bold text-yellow-600">{pendingJobs}</p>
                </div>
                <span className="text-4xl">📥</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Active Jobs</p>
                  <p className="text-3xl font-bold text-orange-600">{activeJobs}</p>
                </div>
                <span className="text-4xl">🔨</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Completed</p>
                  <p className="text-3xl font-bold text-green-600">{completedJobs}</p>
                </div>
                <span className="text-4xl">✅</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Jobs</p>
                  <p className="text-3xl font-bold text-blue-600">{totalJobs}</p>
                </div>
                <span className="text-4xl">📊</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Urgent Jobs Alert */}
        {pendingJobs > 0 && (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">⚠️</span>
                  <div>
                    <h3 className="font-semibold text-yellow-900">You have {pendingJobs} pending job(s)</h3>
                    <p className="text-sm text-yellow-700">Please accept or reject within the response time</p>
                  </div>
                </div>
                <Link href="/contractor/jobs">
                  <Button variant="warning">View Jobs</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Work Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Work Orders</CardTitle>
            <Link href="/contractor/jobs">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {workOrders.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-4xl">📭</span>
                <p className="text-gray-500 mt-2">No work orders assigned yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {workOrders.map((wo) => (
                  <Link
                    key={wo.work_order_id}
                    href={`/contractor/jobs/${wo.work_order_id}`}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <span className="text-2xl">
                        {CATEGORIES_LIST.find(c => c.id === wo.category)?.icon || '🔧'}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">{wo.work_order_id}</p>
                        <p className="text-sm text-gray-500">
                          {CATEGORIES_LIST.find(c => c.id === wo.category)?.name || wo.category}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge variant={getStatusBadgeVariant(wo.status)}>
                        {WORKORDER_STATUS[wo.status.toUpperCase()]?.name || wo.status}
                      </Badge>
                      <span className="text-gray-400">→</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Service Types */}
        <Card>
          <CardHeader>
            <CardTitle>Your Service Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {userData?.service_types?.map((type) => (
                <Badge key={type} variant="primary" className="px-3 py-1">
                  {type.replace('_', ' ').toUpperCase()}
                </Badge>
              )) || <p className="text-gray-500">No service types configured</p>}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Tour Guide */}
      <ContractorTour 
        run={runTour} 
        onComplete={() => {
          setRunTour(false);
          localStorage.setItem('contractorTourCompleted', 'true');
        }} 
      />
      <TourButton 
        onClick={() => {
          localStorage.removeItem('contractorTourCompleted');
          setRunTour(true);
        }}
        color="#f59e0b"
      />
    </DashboardLayout>
  );
}
