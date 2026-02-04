'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const navigation = [
  { name: 'Dashboard', href: '/officer/dashboard', icon: '📊' },
  { name: 'Contractors', href: '/officer/contractors', icon: '👷' },
];

export default function ContractorDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { userData, loading: authLoading } = useAuth();
  const [contractor, setContractor] = useState(null);
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    
    if (!userData || !['class_a', 'class_b', 'class_c'].includes(userData.role)) {
      router.push('/auth/login');
    }
  }, [userData, authLoading, router]);

  useEffect(() => {
    if (params.id && !authLoading && userData && ['class_a', 'class_b', 'class_c'].includes(userData.role)) {
      loadContractor();
      loadWorkOrders();
    }
  }, [params.id, authLoading, userData]);

  const loadContractor = async () => {
    try {
      const response = await fetch(`/api/contractors/${params.id}`);
      const result = await response.json();
      if (result.success) {
        setContractor(result.data);
      } else {
        alert('Contractor not found');
        router.push('/officer/contractors');
      }
    } catch (error) {
      console.error('Error loading contractor:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWorkOrders = async () => {
    try {
      const q = query(
        collection(db, 'work_orders'),
        where('contractor_id', '==', params.id)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setWorkOrders(data);
    } catch (error) {
      console.error('Error loading work orders:', error);
    }
  };

  if (loading || !contractor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const activeOrders = workOrders.filter(wo => ['assigned', 'in_progress'].includes(wo.status));
  const completedOrders = workOrders.filter(wo => wo.status === 'completed');

  return (
    <DashboardLayout navigation={navigation} title="Contractor Details">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{contractor.name}</h1>
            <p className="text-gray-600">{contractor.company_name}</p>
          </div>
          <div className="flex space-x-3">
            {userData?.role === 'class_a' && (
              <Link href={`/officer/contractors/assign-work?contractor=${contractor.id}`}>
                <Button>
                  <span className="mr-2">🔧</span>
                  Assign Work
                </Button>
              </Link>
            )}
            {userData?.role === 'class_b' && (
              <Link href={`/officer/contractors/assign-work?contractor=${contractor.id}`}>
                <Button>
                  <span className="mr-2">🔧</span>
                  Assign Work
                </Button>
              </Link>
            )}
            <Button variant="outline" onClick={() => router.back()}>
              Back
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contractor Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Contractor Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        contractor.status === 'active' ? 'success' :
                        contractor.status === 'pending' ? 'warning' :
                        'secondary'
                      }
                    >
                      {contractor.status}
                    </Badge>
                    {contractor.verified && <Badge variant="info">Verified</Badge>}
                    {contractor.active && <Badge variant="success">Active</Badge>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">{contractor.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium">{contractor.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Registration Number</p>
                      <p className="font-medium">{contractor.registration_number || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Max Concurrent Jobs</p>
                      <p className="font-medium">{contractor.max_concurrent_jobs || 5}</p>
                    </div>
                  </div>

                  {contractor.description && (
                    <div>
                      <p className="text-sm text-gray-600">Description</p>
                      <p className="mt-1">{contractor.description}</p>
                    </div>
                  )}

                  {contractor.specializations?.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Specializations</p>
                      <div className="flex flex-wrap gap-2">
                        {contractor.specializations.map((spec, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
                          >
                            {spec.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Work Orders */}
            <Card>
              <CardHeader>
                <CardTitle>Work Orders ({workOrders.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {workOrders.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No work orders assigned yet</p>
                ) : (
                  <div className="space-y-3">
                    {workOrders.map((wo) => (
                      <div key={wo.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">Ticket: {wo.ticket_id}</p>
                            <p className="text-sm text-gray-600 mt-1">{wo.description}</p>
                            <div className="flex gap-2 mt-2">
                              <Badge variant={
                                wo.status === 'completed' ? 'success' :
                                wo.status === 'in_progress' ? 'info' :
                                wo.status === 'assigned' ? 'warning' :
                                'secondary'
                              }>
                                {wo.status}
                              </Badge>
                              <Badge variant={
                                wo.priority === 'critical' ? 'danger' :
                                wo.priority === 'high' ? 'warning' :
                                'secondary'
                              }>
                                {wo.priority} priority
                              </Badge>
                            </div>
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(wo.assigned_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <p className="text-3xl font-bold text-yellow-600">
                      {contractor.rating || 0}
                    </p>
                    <p className="text-sm text-gray-600">Rating (out of 5)</p>
                  </div>

                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-3xl font-bold text-green-600">
                      {completedOrders.length}
                    </p>
                    <p className="text-sm text-gray-600">Completed Jobs</p>
                  </div>

                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-3xl font-bold text-blue-600">
                      {activeOrders.length}
                    </p>
                    <p className="text-sm text-gray-600">Active Jobs</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-600">Created</p>
                    <p className="font-medium">
                      {new Date(contractor.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {contractor.verified_at && (
                    <div>
                      <p className="text-gray-600">Verified</p>
                      <p className="font-medium">
                        {new Date(contractor.verified_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
