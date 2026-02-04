'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { userService } from '@/lib/userService';
import { DEPARTMENTS_LIST } from '@/lib/constants/departments';
import { WARDS_LIST } from '@/lib/constants/wards';
import { Button, Input, Select, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Alert, AlertDescription } from '@/components/ui';

export default function OfficerRegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    class: '',
    department: '',
    ward_id: '',
    zone: '',
    employeeId: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Name is required');
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
    if (!formData.class) {
      setError('Please select your class');
      return false;
    }
    if (!formData.department) {
      setError('Please select your department');
      return false;
    }
    if (formData.class === 'class_c') {
      if (!formData.ward_id) {
        setError('Class C officers must select a ward');
        return false;
      }
      if (!formData.zone) {
        setError('Zone is required for Class C officers');
        return false;
      }
    }
    if (!formData.employeeId.trim()) {
      setError('Employee ID is required');
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
      const selectedWard = WARDS_LIST.find(w => w.id === formData.ward_id);
      
      const result = await userService.createUser({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        phone: formData.phone,
        class: formData.class,
        role: 'officer',
        department: formData.department,
        ward_id: formData.ward_id || null,
        zone: formData.zone || selectedWard?.zone || null,
        employee_id: formData.employeeId,
        verified: false,
      });

      if (!result.success) {
        setError(result.error);
        setLoading(false);
        return;
      }

      // Show success message and redirect
      router.push('/auth/pending-verification');
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 relative">
            <Image
              src="/logo.svg"
              alt="Municipal Corporation Logo"
              width={64}
              height={64}
              className="w-full h-full object-contain"
            />
          </div>
          <CardTitle className="text-2xl">Officer Registration</CardTitle>
          <CardDescription>
            Register as a Municipal Corporation Officer
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
                <label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="employeeId" className="text-sm font-medium text-gray-700">
                  Employee ID
                </label>
                <Input
                  id="employeeId"
                  name="employeeId"
                  type="text"
                  placeholder="e.g., EMP-12345"
                  value={formData.employeeId}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Official Email Address
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your official email"
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
                placeholder="+91XXXXXXXXXX"
                pattern="\+91[0-9]{10}"
                value={formData.phone}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="class" className="text-sm font-medium text-gray-700">
                  Officer Level
                </label>
                <Select
                  id="class"
                  name="class"
                  value={formData.class}
                  onChange={handleChange}
                  required
                  disabled={loading}
                >
                  <option value="">Select Level</option>
                  <option value="class_c">Class C - Field Supervisor</option>
                  <option value="class_b">Class B - Department Head</option>
                  <option value="class_a">Class A - Commissioner</option>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="department" className="text-sm font-medium text-gray-700">
                  Department
                </label>
                <Select
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  required
                  disabled={loading}
                >
                  <option value="">Select Department</option>
                  {DEPARTMENTS_LIST.map(dept => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {formData.class === 'class_c' && (
              <>
                <div className="space-y-2">
                  <label htmlFor="ward_id" className="text-sm font-medium text-gray-700">
                    Assigned Ward
                  </label>
                  <Select
                    id="ward_id"
                    name="ward_id"
                    value={formData.ward_id}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  >
                    <option value="">Select Ward</option>
                    {WARDS_LIST.map(ward => (
                      <option key={ward.id} value={ward.id}>
                        {ward.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="zone" className="text-sm font-medium text-gray-700">
                    Zone
                  </label>
                  <Input
                    id="zone"
                    name="zone"
                    type="text"
                    placeholder="e.g., WEST, EAST, CENTRAL"
                    value={formData.zone}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>
              </>
            )}

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
                Your account will require verification by a Class A officer before activation.
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
              Already have an account?{' '}
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
