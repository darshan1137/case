'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Textarea, Select, Alert } from '@/components/ui';
import { workOrderService } from '@/lib/workOrderService';
import { reportService } from '@/lib/reportService';
import { contractorService } from '@/lib/contractorService';
import { CATEGORIES_LIST, PRIORITY_LEVELS } from '@/lib/constants/sla';
import { WARDS_LIST, getZoneForWard, getWardName } from '@/lib/constants/wards';
import { DEPARTMENTS_LIST, getDepartmentName } from '@/lib/constants/departments';

export default function CreateWorkOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userData, loading: authLoading } = useAuth();
  
  const [report, setReport] = useState(null);
  const [contractors, setContractors] = useState([]);
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    priority: 'medium',
    ward_id: '',
    department: '',
    contractor_id: '',
    estimated_cost: '',
    deadline: ''
  });
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
      loadInitialData();
    }
  }, [userData, authLoading]);

  const loadInitialData = async () => {
    setLoadingData(true);
    try {
      // Load contractors
      const contractorsResult = await contractorService.getVerifiedContractors();
      if (contractorsResult.success) {
        setContractors(contractorsResult.contractors);
      }

      // Check if creating from a report
      const reportId = searchParams.get('report');
      if (reportId) {
        const reportResult = await reportService.getReportById(reportId);
        if (reportResult.success) {
          setReport(reportResult.report);
          // Pre-fill form from report
          setFormData(prev => ({
            ...prev,
            category: reportResult.report.category,
            description: reportResult.report.description,
            priority: reportResult.report.priority,
            ward_id: reportResult.report.ward_id,
            department: reportResult.report.department
          }));
        }
      }

      // Set default department for officer
      if (userData.department) {
        setFormData(prev => ({
          ...prev,
          department: userData.department
        }));
      }

      // Set default ward for Class C
      if (isClassC && userData.ward_id) {
        setFormData(prev => ({
          ...prev,
          ward_id: userData.ward_id
        }));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getFilteredContractors = () => {
    return contractors.filter(c => {
      // Filter by ward coverage
      if (formData.ward_id && c.coverage_areas) {
        const hasWard = c.coverage_areas.includes(formData.ward_id);
        const hasZone = c.coverage_areas.includes(getZoneForWard(formData.ward_id));
        if (!hasWard && !hasZone && !c.coverage_areas.includes('all')) {
          return false;
        }
      }
      // Filter by service type
      if (formData.category && c.service_types) {
        if (!c.service_types.includes(formData.category) && !c.service_types.includes('general')) {
          return false;
        }
      }
      return c.status === 'active' && c.verified;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validation
      if (!formData.category) throw new Error('Please select a category');
      if (!formData.description) throw new Error('Please provide a description');
      if (!formData.ward_id) throw new Error('Please select a ward');
      if (!formData.department) throw new Error('Please select a department');

      const workOrderData = {
        report_id: report?.report_id || null,
        category: formData.category,
        department: formData.department,
        description: formData.description,
        priority: formData.priority,
        ward_id: formData.ward_id,
        zone_id: getZoneForWard(formData.ward_id),
        location: report?.location || {
          address: '',
          coordinates: { lat: 0, lng: 0 },
          ward_id: formData.ward_id
        },
        images: report?.images || [],
        estimated_cost: formData.estimated_cost ? parseFloat(formData.estimated_cost) : null,
        deadline: formData.deadline ? new Date(formData.deadline) : null,
        created_by: userData.uid,
        created_by_name: userData.name,
        created_by_role: userData.role
      };

      // Create work order
      const result = await workOrderService.createWorkOrder(workOrderData, userData.uid);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create work order');
      }

      // If contractor selected, assign immediately
      if (formData.contractor_id) {
        const contractor = contractors.find(c => c.id === formData.contractor_id);
        await workOrderService.assignWorkOrder(
          result.work_order_id,
          formData.contractor_id,
          contractor?.name || 'Contractor',
          userData.uid
        );
      }

      // Update report status if from report
      if (report?.report_id) {
        await reportService.updateReportStatus(
          report.report_id,
          'assigned',
          userData.uid,
          `Work order ${result.work_order_id} created`
        );
        await reportService.updateReport(report.report_id, {
          work_order_id: result.work_order_id
        });
      }

      setSuccess(`Work order created successfully! ID: ${result.work_order_id}`);
      
      setTimeout(() => {
        router.push(`/officer/work-orders/${result.work_order_id}`);
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const filteredContractors = getFilteredContractors();

  return (
    <DashboardLayout navigation={navigation} title={`${userData?.role?.replace('_', ' ').toUpperCase()} Officer`}>
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Create Work Order</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}

              {/* From Report Info */}
              {report && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">📋</span>
                      <div>
                        <p className="font-medium text-blue-900">Creating from Report</p>
                        <p className="text-sm text-blue-700">{report.report_id}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Category */}
                <Select
                  label="Category *"
                  value={formData.category}
                  onChange={(e) => handleSelectChange('category', e.target.value)}
                  options={[
                    { value: '', label: 'Select category' },
                    ...CATEGORIES_LIST.map(cat => ({
                      value: cat.id,
                      label: `${cat.icon} ${cat.name}`
                    }))
                  ]}
                  required
                />

                {/* Priority */}
                <Select
                  label="Priority *"
                  value={formData.priority}
                  onChange={(e) => handleSelectChange('priority', e.target.value)}
                  options={Object.entries(PRIORITY_LEVELS).map(([key, level]) => ({
                    value: key,
                    label: level.name
                  }))}
                  required
                />

                {/* Department */}
                <Select
                  label="Department *"
                  value={formData.department}
                  onChange={(e) => handleSelectChange('department', e.target.value)}
                  options={[
                    { value: '', label: 'Select department' },
                    ...DEPARTMENTS_LIST.map(dept => ({
                      value: dept.id,
                      label: dept.name
                    }))
                  ]}
                  required
                  disabled={isClassC || isClassB}
                />

                {/* Ward */}
                <Select
                  label="Ward *"
                  value={formData.ward_id}
                  onChange={(e) => handleSelectChange('ward_id', e.target.value)}
                  options={[
                    { value: '', label: 'Select ward' },
                    ...WARDS_LIST.map(ward => ({
                      value: ward.id,
                      label: ward.name
                    }))
                  ]}
                  required
                  disabled={isClassC}
                />
              </div>

              {/* Description */}
              <Textarea
                label="Description *"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Detailed description of the work required"
                rows={4}
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Estimated Cost */}
                <Input
                  label="Estimated Cost (₹)"
                  name="estimated_cost"
                  type="number"
                  value={formData.estimated_cost}
                  onChange={handleInputChange}
                  placeholder="e.g., 5000"
                />

                {/* Deadline */}
                <Input
                  label="Deadline"
                  name="deadline"
                  type="datetime-local"
                  value={formData.deadline}
                  onChange={handleInputChange}
                />
              </div>

              {/* Contractor Selection */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-medium text-gray-900 mb-4">👷 Assign Contractor (Optional)</h3>
                
                {filteredContractors.length === 0 ? (
                  <p className="text-gray-500">No contractors available for this category/ward</p>
                ) : (
                  <>
                    <Select
                      label="Select Contractor"
                      value={formData.contractor_id}
                      onChange={(e) => handleSelectChange('contractor_id', e.target.value)}
                      options={[
                        { value: '', label: 'Assign later' },
                        ...filteredContractors.map(contractor => ({
                          value: contractor.id,
                          label: `${contractor.name} (⭐ ${contractor.rating?.toFixed(1) || 'N/A'})`
                        }))
                      ]}
                    />
                    
                    {formData.contractor_id && (
                      <div className="mt-3 p-3 bg-white rounded border">
                        {(() => {
                          const selectedContractor = contractors.find(c => c.id === formData.contractor_id);
                          return selectedContractor ? (
                            <div>
                              <p className="font-medium">{selectedContractor.name}</p>
                              <p className="text-sm text-gray-500">
                                Rating: ⭐ {selectedContractor.rating?.toFixed(1) || 'N/A'} | 
                                Jobs: {selectedContractor.total_jobs || 0}
                              </p>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {selectedContractor.service_types?.map(type => (
                                  <span key={type} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                    {type}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : null;
                        })()}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Creating...
                    </>
                  ) : (
                    <>
                      <span className="mr-2">✅</span>
                      Create Work Order
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
