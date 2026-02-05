'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, Button, Alert } from '@/components/ui';
import { DEPARTMENTS_LIST, getDepartmentName } from '@/lib/constants/departments';

export default function AddOfficerPage() {
  const router = useRouter();
  const { userData, loading: authLoading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    zone: '',
    ward_id: '',
    class: 'class_b', // Default to class_b
    active: true
  });
  const [validationErrors, setValidationErrors] = useState({});

 const isClassA = userData?.class === 'class_a';
  const isClassB = userData?.class === 'class_b';
  const isClassC = userData?.class === 'class_c';

   const navigation = [
    { name: 'Dashboard', href: '/officer/dashboard', icon: '📊' },
    { name: 'Tickets', href: '/officer/tickets', icon: '🎫' },
    { name: 'Reports', href: '/officer/reports', icon: '📋' },
    { name: 'Work Orders', href: '/officer/work-orders', icon: '🔧' },
    ...(isClassA ? [
      { name: 'Add Contractor', href: '/officer/contractors/add', icon: '➕' },
      { name: 'Add Officer', href: '/officer/officers/add', icon: '👮' },
    ] : []),
    { name: 'Infrastructure Map', href: '/map', icon: '🗺️' },
    { name: 'Route Optimizer', href: '/route', icon: '🛣️' },
    { name: 'Revenue Guard AI', href: '/revenue-audit', icon: '🏛️' },
    { name: 'Assets', href: '/officer/assets', icon: '🏗️' },
    { name: 'Analytics', href: '/officer/analytics', icon: '📈' },
    ...(isClassB || isClassA ? [
      { name: 'Team', href: '/officer/team', icon: '👥' },
      { name: 'Budgets', href: '/officer/budgets', icon: '💰' },
      
    ] : []),
    { name: 'Profile', href: '/officer/profile', icon: '👤' },
  ];

  useEffect(() => {
    if (authLoading) return;

    // CRITICAL: Block access for non-class_a officers
    if (userData?.role !== 'officer' || userData?.class !== 'class_a') {
      router.push('/officer/dashboard');
      return;
    }
  }, [userData, authLoading, router]);

  const validateForm = () => {
    const errors = {};

    // Name validation
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      errors.email = 'Invalid email address';
    }

    // Phone validation (India: 10 digits starting with 6-9)
    const phoneClean = formData.phone.replace(/\D/g, '');
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneClean || !phoneRegex.test(phoneClean)) {
      errors.phone = 'Phone must be 10 digits starting with 6-9';
    }

    // Department validation
    if (!formData.department) {
      errors.department = 'Department is required';
    }

    // Zone validation
    if (!formData.zone || !formData.zone.trim()) {
      errors.zone = 'Zone is required';
    }

    // Ward validation
    if (!formData.ward_id || !formData.ward_id.trim()) {
      errors.ward_id = 'Ward is required';
    }

    // Officer class validation
    if (!formData.class || !['class_b', 'class_c'].includes(formData.class)) {
      errors.class = 'Invalid officer class';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate form
    if (!validateForm()) {
      setError('Please fix the errors in the form');
      return;
    }

    setSubmitting(true);

    try {
      const userId = userData.id || userData.uid;

      // Prepare officer data
      const officerData = {
        name: formData.name.trim(),
        email: formData.email.toLowerCase().trim(),
        phone: formData.phone.replace(/\D/g, ''),
        department: formData.department,
        zone: formData.zone,
        ward_id: formData.ward_id,
        class: formData.class,
        created_by_uid: userId,
        created_by_role: userData.role,
        created_by_class: userData.class,
        active: formData.active
      };

      console.log('Submitting officer data:', officerData);

      const response = await fetch('/api/officers/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(officerData)
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle specific error codes
        if (result.code === 'EMAIL_EXISTS') {
          setValidationErrors({ email: 'This email is already registered' });
          throw new Error('Email already exists');
        } else if (result.code === 'PHONE_EXISTS') {
          setValidationErrors({ phone: 'This phone number is already registered' });
          throw new Error('Phone already exists');
        } else if (result.code === 'UNAUTHORIZED_ROLE') {
          throw new Error('Unauthorized: Only Class-A officers can add officers');
        } else {
          throw new Error(result.error || 'Failed to create officer');
        }
      }

      // Success!
      setSuccess(`✓ Officer "${result.officer.name}" (${result.officer.class.toUpperCase()}) created successfully! Login credentials have been sent to ${result.officer.email}.`);
      
      // Clear form
      setFormData({
        name: '',
        email: '',
        phone: '',
        department: '',
        zone: '',
        ward_id: '',
        class: 'class_b',
        active: true
      });

      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
      setError(err.message || 'Failed to create officer');
      console.error('Error creating officer:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddAnother = () => {
    setSuccess('');
    setError('');
    setFormData({
      name: '',
      email: '',
      phone: '',
      department: '',
      zone: '',
      ward_id: '',
      class: 'class_b',
      active: true
    });
  };

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Block rendering for non-class_a officers
  if (!isClassA) {
    return null;
  }

  return (
    <DashboardLayout navigation={navigation} title="Officer Portal - Class A">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/officer/team">
            <Button variant="outline" className="mb-4">← Back to Team</Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">👮</span>
            <h1 className="text-3xl font-bold text-gray-900">Add New Officer</h1>
          </div>
          <p className="text-gray-600">Onboard a new Class-B or Class-C officer (Class-A Officers Only)</p>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="mb-6">
            <Alert variant="danger">{error}</Alert>
          </div>
        )}

        {success && (
          <div className="mb-6">
            <Alert variant="success">
              <div className="flex flex-col gap-3">
                <p>{success}</p>
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleAddAnother}
                  >
                    ➕ Add Another Officer
                  </Button>
                  <Link href="/officer/team">
                    <Button variant="primary" size="sm">
                      👥 View Team
                    </Button>
                  </Link>
                </div>
              </div>
            </Alert>
          </div>
        )}

        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle>Officer Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter officer's full name"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    validationErrors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={submitting}
                />
                {validationErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="officer@municipal.gov.in"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    validationErrors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={submitting}
                />
                {validationErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">Login credentials will be sent to this email</p>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="98XXXXXXXX"
                  maxLength="10"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    validationErrors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={submitting}
                />
                {validationErrors.phone && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.phone}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">10 digits starting with 6-9</p>
              </div>

              {/* Officer Class */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Officer Class <span className="text-red-500">*</span>
                </label>
                <select
                  name="class"
                  value={formData.class}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    validationErrors.class ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={submitting}
                >
                  <option value="class_b">Class B - Department Level Officer</option>
                  <option value="class_c">Class C - Ward Level Officer</option>
                </select>
                {validationErrors.class && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.class}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Class B: Department-level oversight • Class C: Ward-level operations
                </p>
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Department <span className="text-red-500">*</span>
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    validationErrors.department ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={submitting}
                >
                  <option value="">Select Department</option>
                  {DEPARTMENTS_LIST.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                {validationErrors.department && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.department}</p>
                )}
              </div>

              {/* Zone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Zone <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="zone"
                  value={formData.zone}
                  onChange={handleInputChange}
                  placeholder="e.g., Zone A, Central Zone"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    validationErrors.zone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={submitting}
                />
                {validationErrors.zone && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.zone}</p>
                )}
              </div>

              {/* Ward */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ward <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="ward_id"
                  value={formData.ward_id}
                  onChange={handleInputChange}
                  placeholder="e.g., Ward A, H-West Ward"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    validationErrors.ward_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={submitting}
                />
                {validationErrors.ward_id && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.ward_id}</p>
                )}
              </div>

              {/* Active Status Toggle */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  name="active"
                  id="active"
                  checked={formData.active}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  disabled={submitting}
                />
                <label htmlFor="active" className="flex-1 cursor-pointer">
                  <span className="text-sm font-semibold text-gray-900">Active Status</span>
                  <p className="text-xs text-gray-600">Officer can access the system and perform duties</p>
                </label>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  formData.active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {formData.active ? '✓ Active' : 'Inactive'}
                </span>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <span className="text-2xl">ℹ️</span>
                  <div className="flex-1">
                    <p className="text-sm text-blue-900 font-semibold mb-1">What happens after creation?</p>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Officer account is created with role &quot;officer&quot;</li>
                      <li>• Secure temporary password is auto-generated</li>
                      <li>• Onboarding email is sent with login credentials</li>
                      <li>• Officer can immediately access their dashboard and start working</li>
                      <li>• Officer will be prompted to change password on first login</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <Link href="/officer/team" className="flex-1">
                  <Button 
                    type="button"
                    variant="outline" 
                    className="w-full"
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Creating Officer...
                    </>
                  ) : (
                    <>
                      <span className="mr-2">✓</span>
                      Create Officer Account
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Help Card */}
        <Card className="mt-6 border-l-4 border-l-indigo-500">
          <CardContent className="pt-6">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center">
              <span className="mr-2">💡</span> Officer Class Definitions
            </h3>
            <div className="space-y-3 text-sm">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <h4 className="font-semibold text-purple-900 mb-1">Class B Officer (Department Level)</h4>
                <p className="text-purple-800">
                  Manages department-wide operations, oversees multiple wards, reviews all reports in their department, 
                  and can manage teams and budgets. Has elevated permissions for administrative tasks.
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h4 className="font-semibold text-blue-900 mb-1">Class C Officer (Ward Level)</h4>
                <p className="text-blue-800">
                  Handles day-to-day operations within a specific ward, validates citizen reports, creates work orders, 
                  and manages local contractors. Focused on ground-level execution.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-2">Important Notes:</h4>
              <ul className="space-y-1 text-gray-700">
                <li className="flex items-start">
                  <span className="text-indigo-500 font-bold mr-3">•</span>
                  <span>Ensure the email address is valid and belongs to the officer</span>
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-500 font-bold mr-3">•</span>
                  <span>Verify phone number for secure account recovery</span>
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-500 font-bold mr-3">•</span>
                  <span>Officer will receive login credentials via email immediately</span>
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-500 font-bold mr-3">•</span>
                  <span>Inactive officers cannot log in or perform any operations</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
