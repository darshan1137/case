'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Select } from '@/components/ui';
import { workOrderService } from '@/lib/workOrderService';
import { WORKORDER_STATUS, CATEGORIES_LIST } from '@/lib/constants/sla';

const navigation = [
  { name: 'Dashboard', href: '/contractor/dashboard', icon: '📊' },
  { name: 'Assigned Jobs', href: '/contractor/jobs', icon: '📋' },
  { name: 'Active Jobs', href: '/contractor/jobs/active', icon: '🔨' },
  { name: 'Completed', href: '/contractor/jobs/completed', icon: '✅' },
  { name: 'Route Map', href: '/contractor/map', icon: '🗺️' },
  { name: 'Performance', href: '/contractor/performance', icon: '📈' },
  { name: 'Profile', href: '/contractor/profile', icon: '👤' },
];

export default function ContractorJobsPage() {
  const router = useRouter();
  const { userData, loading: authLoading } = useAuth();
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!authLoading && userData?.role !== 'contractor') {
      router.push('/auth/login');
      return;
    }

    if (userData) {
      loadWorkOrders();
    }
  }, [userData, authLoading]);

  const loadWorkOrders = async () => {
    setLoading(true);
    try {
      const result = await workOrderService.getWorkOrdersByContractor(userData.uid);
      if (result.success) {
        setWorkOrders(result.work_orders);
      }
    } catch (error) {
      console.error('Error loading work orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptJob = async (workOrderId) => {
    try {
      const result = await workOrderService.acceptWorkOrder(workOrderId, userData.uid);
      if (result.success) {
        loadWorkOrders();
      }
    } catch (error) {
      console.error('Error accepting job:', error);
    }
  };

  const handleRejectJob = async (workOrderId) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      const result = await workOrderService.rejectWorkOrder(workOrderId, reason, userData.uid);
      if (result.success) {
        loadWorkOrders();
      }
    } catch (error) {
      console.error('Error rejecting job:', error);
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

  const filteredOrders = workOrders.filter(wo => {
    if (filter === 'all') return true;
    if (filter === 'pending') return wo.status === 'assigned';
    if (filter === 'active') return ['accepted', 'en_route', 'on_site', 'in_progress'].includes(wo.status);
    if (filter === 'completed') return ['completed', 'verified', 'closed'].includes(wo.status);
    return wo.status === filter;
  });

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
            <h1 className="text-2xl font-bold text-gray-900">My Jobs</h1>
            <p className="text-gray-600">Manage your assigned work orders</p>
          </div>
          <Select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Jobs' },
              { value: 'pending', label: 'Pending Acceptance' },
              { value: 'active', label: 'Active Jobs' },
              { value: 'completed', label: 'Completed' }
            ]}
            className="w-48"
          />
        </div>

        {/* Pending Jobs Alert */}
        {workOrders.filter(wo => wo.status === 'assigned').length > 0 && (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <span className="text-3xl">⚠️</span>
                <div>
                  <h3 className="font-semibold text-yellow-900">
                    {workOrders.filter(wo => wo.status === 'assigned').length} job(s) awaiting your response
                  </h3>
                  <p className="text-sm text-yellow-700">
                    Please accept or reject within the response deadline
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Work Orders List */}
        <Card>
          <CardHeader>
            <CardTitle>Work Orders ({filteredOrders.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-6xl">📭</span>
                <h3 className="text-lg font-medium text-gray-900 mt-4">No jobs found</h3>
                <p className="text-gray-500 mt-2">
                  {workOrders.length === 0 
                    ? "You don't have any assigned jobs yet" 
                    : "No jobs match your current filter"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((wo) => (
                  <div
                    key={wo.work_order_id}
                    className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <span className="text-3xl">
                          {CATEGORIES_LIST.find(c => c.id === wo.category)?.icon || '🔧'}
                        </span>
                        <div>
                          <div className="flex items-center space-x-2">
                            <Link href={`/contractor/jobs/${wo.work_order_id}`}>
                              <h3 className="font-semibold text-gray-900 hover:text-blue-600">
                                {wo.work_order_id}
                              </h3>
                            </Link>
                            <Badge variant={getStatusBadgeVariant(wo.status)}>
                              {WORKORDER_STATUS[wo.status.toUpperCase()]?.name || wo.status}
                            </Badge>
                            {wo.priority === 'emergency' && (
                              <Badge variant="danger">URGENT</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {CATEGORIES_LIST.find(c => c.id === wo.category)?.name || wo.category}
                          </p>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {wo.description}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                            <span>📅 Assigned: {formatDate(wo.assigned_at)}</span>
                            {wo.location?.address && (
                              <span>📍 {wo.location.address.substring(0, 40)}...</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex flex-col space-y-2">
                        {wo.status === 'assigned' && (
                          <>
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => handleAcceptJob(wo.work_order_id)}
                            >
                              ✅ Accept
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRejectJob(wo.work_order_id)}
                            >
                              ❌ Reject
                            </Button>
                          </>
                        )}
                        <Link href={`/contractor/jobs/${wo.work_order_id}`}>
                          <Button variant="outline" size="sm" className="w-full">
                            View Details
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
