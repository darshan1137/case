'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { userService } from '@/lib/userService';
import { CONTRACTOR_SERVICE_TYPES_LIST } from '@/lib/constants';
import { WARDS_LIST } from '@/lib/constants/wards';
import { Button, Input, Select, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Alert, AlertDescription, Textarea } from '@/components/ui';

export default function ContractorRegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    serviceTypes: [],
    coveredWards: [],
    gstNumber: '',
    address: '',
    fleetSize: '',
    workforceSize: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleMultiSelect = (e, field) => {
    const options = e.target.options;
    const selected = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(options[i].value);
      }
    }
    setFormData(prev => ({ ...prev, [field]: selected }));
  };

  const validateForm = () => {
    if (!formData.companyName.trim()) {
      setError('Company name is required');
      return false;
    }
    if (!formData.contactPerson.trim()) {
      setError('Contact person name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!formData.phone.trim()) {
      setError('Phone number is required');
      return false;
    }
    if (formData.serviceTypes.length === 0) {
      setError('Please select at least one service type');
      return false;
    }
    if (formData.coveredWards.length === 0) {
      setError('Please select at least one ward for coverage');
      return false;
    }
    if (!formData.gstNumber.trim()) {
      setError('GST number is required');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      const result = await userService.createUser({
        email: formData.email,
        password: formData.password,
        name: formData.companyName,
        phone: formData.phone,
        role: 'contractor',
        department: null,
        ward_id: null,
        zone: null,
        // Additional contractor fields
        contact_person: formData.contactPerson,
        service_types: formData.serviceTypes,
        covered_wards: formData.coveredWards,
        gst_number: formData.gstNumber,
        address: formData.address,
        fleet_size: parseInt(formData.fleetSize) || 0,
        workforce_size: parseInt(formData.workforceSize) || 0,
        rating: 0,
        total_jobs: 0,
        completed_jobs: 0,
        verified: false, // Needs verification by officer
        active: false, // Inactive until verified
      });

      if (!result.success) {
        setError(result.error);
        setLoading(false);
        return;
      }

      router.push('/auth/pending-verification?type=contractor');
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-orange-600 flex items-center justify-center">
            <span className="text-2xl text-white">🏗️</span>
          </div>
          <CardTitle className="text-2xl">Contractor Registration</CardTitle>
          <CardDescription>
            Register as a Municipal Corporation Contractor/Vendor
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="error">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="companyName" className="text-sm font-medium text-gray-700">
                  Company Name
                </label>
                <Input
                  id="companyName"
                  name="companyName"
                  type="text"
                  placeholder="Enter company name"
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="contactPerson" className="text-sm font-medium text-gray-700">
                  Contact Person
                </label>
                <Input
                  id="contactPerson"
                  name="contactPerson"
                  type="text"
                  placeholder="Primary contact name"
                  value={formData.contactPerson}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="company@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="Contact number"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="gstNumber" className="text-sm font-medium text-gray-700">
                  GST Number
                </label>
                <Input
                  id="gstNumber"
                  name="gstNumber"
                  type="text"
                  placeholder="GST registration number"
                  value={formData.gstNumber}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Fleet & Workforce
                </label>
                <div className="flex gap-2">
                  <Input
                    name="fleetSize"
                    type="number"
                    placeholder="Vehicles"
                    value={formData.fleetSize}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <Input
                    name="workforceSize"
                    type="number"
                    placeholder="Workers"
                    value={formData.workforceSize}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="address" className="text-sm font-medium text-gray-700">
                Business Address
              </label>
              <Textarea
                id="address"
                name="address"
                placeholder="Enter complete business address"
                value={formData.address}
                onChange={handleChange}
                disabled={loading}
                className="min-h-[60px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Service Types (Hold Ctrl to select multiple)
                </label>
                <select
                  multiple
                  className="w-full h-32 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => handleMultiSelect(e, 'serviceTypes')}
                  disabled={loading}
                >
                  {CONTRACTOR_SERVICE_TYPES_LIST.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Coverage Areas (Hold Ctrl to select multiple)
                </label>
                <select
                  multiple
                  className="w-full h-32 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => handleMultiSelect(e, 'coveredWards')}
                  disabled={loading}
                >
                  {WARDS_LIST.map(ward => (
                    <option key={ward.id} value={ward.id}>
                      {ward.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Min 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <Alert variant="info">
              <AlertDescription>
                Your registration will be reviewed and verified by a Class B or Class C officer before activation.
              </AlertDescription>
            </Alert>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Registration'}
            </Button>
            
            <div className="text-sm text-center text-gray-600">
              Already registered?{' '}
              <Link href="/auth/login" className="text-blue-600 hover:underline font-medium">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
