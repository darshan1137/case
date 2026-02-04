'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Input } from '@/components/ui';


 

const SPECIALIZATIONS = [
  'pothole_repair',
  'garbage_collection',
  'pipe_repair',
  'drainage',
  'road_maintenance',
  'general'
];

export default function OfficerContractorsPage() {
  const router = useRouter();
  const { userData, loading: authLoading } = useAuth();
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState([
    { name: '', email: '', phone: '', company_name: '', specializations: [] }
  ]);
  const isClassA = userData?.role === 'officer' && userData?.class === 'class_a';
  const isClassB = userData?.role === 'officer' && userData?.class === 'class_b';
  const isClassC = userData?.role === 'officer' && userData?.class === 'class_c';

   const navigation = [
    { name: 'Dashboard', href: '/officer/dashboard', icon: '📊' },
    { name: 'Reports', href: '/officer/reports', icon: '📋' },
    { name: 'Tickets', href: '/officer/tickets', icon: '📋' },
    { name: 'Work Orders', href: '/officer/work-orders', icon: '🔧' },
    { name: 'Contractors', href: '/officer/contractors', icon: '👷' },
    ...(isClassA ? [
      { name: '➕ Add Contractor', href: '/officer/contractors/add', icon: '➕' },
    ] : []),
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

  const isAdmin = userData?.role === 'officer' && userData?.class === 'class_a';
  const isOfficer = userData?.role == "officer"

  useEffect(() => {
    if (authLoading) return;
    
    if (!userData || userData.role != "officer") {
      router.push('/auth/login');
    }
  }, [userData, authLoading, router]);

  useEffect(() => {
    if (!authLoading && userData && userData.role === "officer") {
      loadContractors();
    }
  }, [userData, authLoading, filter]);

  const loadContractors = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/contractors');
      const result = await response.json();
      if (result.success) {
        setContractors(result.data);
      }
    } catch (error) {
      console.error('Error loading contractors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRow = () => {
    setFormData([...formData, { name: '', email: '', phone: '', company_name: '', specializations: [] }]);
  };

  const handleRemoveRow = (index) => {
    setFormData(formData.filter((_, i) => i !== index));
  };

  const handleChange = (index, field, value) => {
    const updated = [...formData];
    updated[index][field] = value;
    setFormData(updated);
  };

  const handleSpecializationToggle = (index, spec) => {
    const updated = [...formData];
    if (updated[index].specializations.includes(spec)) {
      updated[index].specializations = updated[index].specializations.filter(s => s !== spec);
    } else {
      updated[index].specializations = [...updated[index].specializations, spec];
    }
    setFormData(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validContractors = formData.filter(c => c.name && c.email && c.phone);
    if (validContractors.length === 0) {
      alert('Please fill in at least one contractor with name, email, and phone');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/contractors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractors: validContractors })
      });

      const result = await response.json();
      if (result.success) {
        alert(`${result.count} contractor(s) added successfully!`);
        setFormData([{ name: '', email: '', phone: '', company_name: '', specializations: [] }]);
        setShowAddForm(false);
        loadContractors();
      } else {
        alert('Error adding contractors: ' + result.error);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to add contractors');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (contractorId) => {
    try {
      const response = await fetch(`/api/contractors/${contractorId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verified: true,
          status: 'active',
          verified_at: new Date().toISOString()
        })
      });

      if (response.ok) {
        alert('Contractor verified!');
        loadContractors();
      }
    } catch (error) {
      console.error('Error verifying contractor:', error);
    }
  };

  const handleDelete = async (contractorId) => {
    if (!confirm('Are you sure you want to delete this contractor?')) return;

    try {
      const response = await fetch(`/api/contractors/${contractorId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('Contractor deleted!');
        loadContractors();
      }
    } catch (error) {
      console.error('Error deleting contractor:', error);
    }
  };

  const filteredContractors = contractors.filter(c => {
    if (filter !== 'all' && c.status !== filter) return false;
    return (
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const stats = {
    total: contractors.length,
    active: contractors.filter(c => c.status === 'active').length,
    pending: contractors.filter(c => c.status === 'pending').length,
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <DashboardLayout navigation={navigation} title="Contractors">
      <div className="space-y-6">
        {/* Header - Different for Admin */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isAdmin ? 'Contractors Management' : 'Contractors Directory'}
            </h1>
            <p className="text-gray-600">
              {isAdmin ? 'Manage and assign work to contractors' : 'View and manage contractors for work assignments'}
            </p>
          </div>
          <div className="flex space-x-3">
            {isAdmin && (
              <>
                <Link href="/officer/contractors/assign-work">
                  <Button variant="outline">
                    <span className="mr-2">🔧</span>
                    Assign Work
                  </Button>
                </Link>
                <Button onClick={() => setShowAddForm(!showAddForm)}>
                  <span className="mr-2">➕</span>
                  {showAddForm ? 'Hide Form' : 'Add Contractor'}
                </Button>
              </>
            )}
            {isOfficer && userData?.role === 'class_b' && (
              <Link href="/officer/contractors/assign-work">
                <Button>
                  <span className="mr-2">🔧</span>
                  Assign Work
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Add Form - Only for Admin */}
        {isAdmin && showAddForm && (
          <Card>
            <CardHeader>
              <CardTitle>Add Multiple Contractors</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {formData.map((contractor, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">Contractor {index + 1}</h3>
                      {formData.length > 1 && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveRow(index)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Name *"
                        value={contractor.name}
                        onChange={(e) => handleChange(index, 'name', e.target.value)}
                        className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="email"
                        placeholder="Email *"
                        value={contractor.email}
                        onChange={(e) => handleChange(index, 'email', e.target.value)}
                        className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="tel"
                        placeholder="Phone *"
                        value={contractor.phone}
                        onChange={(e) => handleChange(index, 'phone', e.target.value)}
                        className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Company Name"
                        value={contractor.company_name}
                        onChange={(e) => handleChange(index, 'company_name', e.target.value)}
                        className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Specializations
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {SPECIALIZATIONS.map((spec) => (
                          <label key={spec} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={contractor.specializations.includes(spec)}
                              onChange={() => handleSpecializationToggle(index, spec)}
                              className="w-4 h-4"
                            />
                            <span className="text-sm">{spec.replace(/_/g, ' ')}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex justify-between pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddRow}
                  >
                    Add Another Contractor
                  </Button>
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddForm(false)}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? 'Adding...' : 'Add Contractors'}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Total Contractors</p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                </div>
                <span className="text-4xl opacity-80">👷</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Active</p>
                  <p className="text-3xl font-bold">{stats.active}</p>
                </div>
                <span className="text-4xl opacity-80">✅</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Pending</p>
                  <p className="text-3xl font-bold">{stats.pending}</p>
                </div>
                <span className="text-4xl opacity-80">⏳</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Search contractors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filter === 'all' ? 'primary' : 'outline'}
                  onClick={() => setFilter('all')}
                  size="sm"
                >
                  All
                </Button>
                <Button
                  variant={filter === 'active' ? 'primary' : 'outline'}
                  onClick={() => setFilter('active')}
                  size="sm"
                >
                  Active
                </Button>
                <Button
                  variant={filter === 'pending' ? 'primary' : 'outline'}
                  onClick={() => setFilter('pending')}
                  size="sm"
                >
                  Pending
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contractors List */}
        <Card>
          <CardHeader>
            <CardTitle>Contractors ({filteredContractors.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredContractors.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No contractors found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredContractors.map((contractor) => (
                  <div
                    key={contractor.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {contractor.name}
                          </h3>
                          <Badge
                            variant={
                              contractor.status === 'active' ? 'success' :
                              contractor.status === 'pending' ? 'warning' :
                              'secondary'
                            }
                          >
                            {contractor.status}
                          </Badge>
                          {contractor.verified && (
                            <Badge variant="info">Verified</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{contractor.company_name}</p>
                        <p className="text-sm text-gray-500">{contractor.email} • {contractor.phone}</p>
                        
                        {contractor.specializations?.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {contractor.specializations.map((spec, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                              >
                                {spec.replace(/_/g, ' ')}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                          <span>⭐ {contractor.rating || 0}/5</span>
                          <span>✅ {contractor.total_jobs_completed || 0} jobs</span>
                          <span>🔧 {contractor.current_active_jobs || 0} active</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        <Link href={`/officer/contractors/${contractor.id}`}>
                          <Button variant="outline" size="sm" className="w-full">
                            View Details
                          </Button>
                        </Link>
                        
                        {isAdmin && contractor.status === 'pending' && !contractor.verified && (
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleVerify(contractor.id)}
                          >
                            Verify
                          </Button>
                        )}
                        
                        {(isAdmin || userData?.role === 'class_b') && contractor.status === 'active' && (
                          <Link href={`/officer/contractors/assign-work?contractor=${contractor.id}`}>
                            <Button variant="primary" size="sm" className="w-full">
                              Assign Work
                            </Button>
                          </Link>
                        )}

                        {isAdmin && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(contractor.id)}
                          >
                            Delete
                          </Button>
                        )}
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
