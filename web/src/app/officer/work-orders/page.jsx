'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Select, Input } from '@/components/ui';
import { workOrderService } from '@/lib/workOrderService';
import { WORKORDER_STATUS, CATEGORIES_LIST } from '@/lib/constants/sla';
import { getDepartmentName } from '@/lib/constants/departments';
import { getWardName } from '@/lib/constants/wards';

export default function OfficerWorkOrdersPage() {
  const router = useRouter();
  const { userData, loading: authLoading } = useAuth();
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    status: 'all',
    category: 'all'
  });
  const [searchQuery, setSearchQuery] = useState('');

  const isClassA = userData?.role === 'class_a';
  const isClassB = userData?.role === 'class_b';
  const isClassC = userData?.role === 'class_c';

  const navigation = [
    { name: 'Dashboard', href: '/officer/dashboard', icon: '📊' },
    { name: 'Reports', href: '/officer/reports', icon: '📋' },
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
      if (!['class_c', 'class_b', 'class_a'].includes(userData?.role)) {
        router.push('/auth/login');
        return;
      }
      loadWorkOrders();
    }
  }, [userData, authLoading]);

  const loadWorkOrders = async () => {
    setLoading(true);
    try {
      let result;

      if (isClassA) {
        result = await workOrderService.getAllWorkOrders({ limitCount: 200 });
      } else if (isClassB) {
        result = await workOrderService.getAllWorkOrders({ 
          department: userData.department,
          limitCount: 200 
        });
      } else {
        result = await workOrderService.getWorkOrdersByWard(userData.ward_id, { limitCount: 200 });
      }

      if (result.success) {
        setWorkOrders(result.work_orders);
      }
    } catch (error) {
      console.error('Error loading work orders:', error);
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

  const filteredWorkOrders = workOrders.filter(wo => {
    const matchesStatus = filter.status === 'all' || wo.status === filter.status;
    const matchesCategory = filter.category === 'all' || wo.category === filter.category;
    const matchesSearch = !searchQuery || 
      wo.work_order_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wo.contractor_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesCategory && matchesSearch;
  });

  const needsVerification = workOrders.filter(wo => wo.status === 'completed').length;

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
            <h1 className="text-2xl font-bold text-gray-900">Work Orders</h1>
            <p className="text-gray-600">
              {isClassC && `Ward: ${getWardName(userData.ward_id)}`}
              {isClassB && `Department: ${getDepartmentName(userData.department)}`}
              {isClassA && 'All Work Orders'}
            </p>
          </div>
          <div className="flex space-x-3">
            {needsVerification > 0 && (
              <Button
                variant="warning"
                onClick={() => setFilter(prev => ({ ...prev, status: 'completed' }))}
              >
                🔍 Verify ({needsVerification})
              </Button>
            )}
            <Link href="/officer/work-orders/new">
              <Button>
                <span className="mr-2">➕</span>
                New Work Order
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                placeholder="Search by ID or contractor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Select
                value={filter.status}
                onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
                options={[
                  { value: 'all', label: 'All Status' },
                  ...Object.entries(WORKORDER_STATUS).map(([key, val]) => ({
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
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Work Orders List */}
        <Card>
          <CardHeader>
            <CardTitle>Work Orders ({filteredWorkOrders.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredWorkOrders.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-6xl">📭</span>
                <h3 className="text-lg font-medium text-gray-900 mt-4">No work orders found</h3>
                <Link href="/officer/work-orders/new">
                  <Button className="mt-4">Create Work Order</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredWorkOrders.map((wo) => (
                  <Link
                    key={wo.work_order_id}
                    href={`/officer/work-orders/${wo.work_order_id}`}
                    className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <span className="text-3xl">
                          {CATEGORIES_LIST.find(c => c.id === wo.category)?.icon || '🔧'}
                        </span>
                        <div>
                          <div className="flex items-center space-x-2 flex-wrap gap-1">
                            <h3 className="font-semibold text-gray-900">
                              {wo.work_order_id}
                            </h3>
                            <Badge variant={getStatusBadgeVariant(wo.status)}>
                              {WORKORDER_STATUS[wo.status.toUpperCase()]?.name || wo.status}
                            </Badge>
                            {wo.priority === 'emergency' && (
                              <Badge variant="danger">URGENT</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {CATEGORIES_LIST.find(c => c.id === wo.category)?.name}
                          </p>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                            {wo.description}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                            <span>📅 {formatDate(wo.created_at)}</span>
                            <span>📍 {getWardName(wo.ward_id)}</span>
                            <span>👷 {wo.contractor_name || 'Unassigned'}</span>
                          </div>
                        </div>
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
