'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, Button, Alert } from '@/components/ui';

export default function AddContractorPage() {
  const router = useRouter();
  const { userData, loading: authLoading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    zone: '',
    wards: '',
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

      // Prepare contractor data
      const contractorData = {
        name: formData.name.trim(),
        email: formData.email.toLowerCase().trim(),
        phone: formData.phone.replace(/\D/g, ''),
        created_by_uid: userId,
        created_by_role: userData.role,
        created_by_class: userData.officer_class,
        active: formData.active,
        // Optional fields
        ...(formData.zone && { zone: formData.zone.trim() }),
        ...(formData.wards && { wards: formData.wards.split(',').map(w => w.trim()).filter(w => w) })
      };

      console.log('Submitting contractor data:', contractorData);

      const response = await fetch('/api/contractors/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contractorData)
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
          throw new Error('Unauthorized: Only Class-A officers can add contractors');
        } else {
          throw new Error(result.error || 'Failed to create contractor');
        }
      }

      // Success!
      setSuccess(`✓ Contractor "${result.contractor.name}" created successfully! Login credentials have been sent to ${result.contractor.email}.`);
      
      // Clear form
      setFormData({
        name: '',
        email: '',
        phone: '',
        zone: '',
        wards: '',
        active: true
      });

      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
      setError(err.message || 'Failed to create contractor');
      console.error('Error creating contractor:', err);
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
      zone: '',
      wards: '',
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
          <Link href="/officer/contractors">
            <Button variant="outline" className="mb-4">← Back to Contractors</Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">➕</span>
            <h1 className="text-3xl font-bold text-gray-900">Add New Contractor</h1>
          </div>
          <p className="text-gray-600">Register a new contractor account (Class-A Officers Only)</p>
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
                    ➕ Add Another Contractor
                  </Button>
                  <Link href="/officer/contractors">
                    <Button variant="primary" size="sm">
                      📋 View Contractor List
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
            <CardTitle>Contractor Information</CardTitle>
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
                  placeholder="Enter contractor's full name"
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
                  placeholder="contractor@example.com"
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

              {/* Zone (Optional) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Zone (Optional)
                </label>
                <input
                  type="text"
                  name="zone"
                  value={formData.zone}
                  onChange={handleInputChange}
                  placeholder="e.g., North Zone, South Zone"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  disabled={submitting}
                />
              </div>

              {/* Wards (Optional) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Assigned Wards (Optional)
                </label>
                <input
                  type="text"
                  name="wards"
                  value={formData.wards}
                  onChange={handleInputChange}
                  placeholder="Ward A, Ward B, Ward C"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  disabled={submitting}
                />
                <p className="mt-1 text-xs text-gray-500">Comma-separated list of wards</p>
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
                  <p className="text-xs text-gray-600">Contractor can receive work assignments</p>
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
                      <li>• Contractor account is created with role &quot;contractor&quot;</li>
                      <li>• Temporary password is auto-generated</li>
                      <li>• Onboarding email is sent with login credentials</li>
                      <li>• Contractor can immediately be assigned work orders</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <Link href="/officer/contractors" className="flex-1">
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
                      Creating Contractor...
                    </>
                  ) : (
                    <>
                      <span className="mr-2">✓</span>
                      Create Contractor Account
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
              <span className="mr-2">💡</span> Tips for Adding Contractors
            </h3>
            <ul className="space-y-2 text-gray-700 text-sm">
              <li className="flex items-start">
                <span className="text-indigo-500 font-bold mr-3">•</span>
                <span>Ensure the email address is valid and belongs to the contractor</span>
              </li>
              <li className="flex items-start">
                <span className="text-indigo-500 font-bold mr-3">•</span>
                <span>Verify phone number is correct for OTP verification (if enabled)</span>
              </li>
              <li className="flex items-start">
                <span className="text-indigo-500 font-bold mr-3">•</span>
                <span>Contractor will receive login credentials via email immediately</span>
              </li>
              <li className="flex items-start">
                <span className="text-indigo-500 font-bold mr-3">•</span>
                <span>You can assign wards later from the contractor detail page</span>
              </li>
              <li className="flex items-start">
                <span className="text-indigo-500 font-bold mr-3">•</span>
                <span>Inactive contractors cannot be assigned new work orders</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
