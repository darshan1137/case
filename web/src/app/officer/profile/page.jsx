'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Alert, Badge } from '@/components/ui';
import { userService } from '@/lib/userService';
import { getDepartmentName } from '@/lib/constants/departments';
import { getWardName } from '@/lib/constants/wards';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function OfficerProfilePage() {
  const router = useRouter();
  const { user, userData, loading: authLoading } = useAuth();
  
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
  
  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    employee_id: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!authLoading) {
      if (!['class_c', 'class_b', 'class_a'].includes(userData?.role)) {
        router.push('/auth/login');
        return;
      }
    }

    if (userData) {
      setProfileData({
        name: userData.name || '',
        phone: userData.phone || '',
        employee_id: userData.employee_id || ''
      });
    }
  }, [userData, authLoading]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const result = await userService.updateUser(userData.uid, {
        name: profileData.name,
        phone: profileData.phone
      });

      if (result.success) {
        setSuccess('Profile updated successfully!');
      } else {
        setError(result.error || 'Failed to update profile');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const credential = EmailAuthProvider.credential(
        user.email,
        passwordData.currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, passwordData.newPassword);

      setSuccess('Password updated successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      if (err.code === 'auth/wrong-password') {
        setError('Current password is incorrect');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = () => {
    if (isClassA) return 'Class A - City Commissioner';
    if (isClassB) return 'Class B - Department Head';
    if (isClassC) return 'Class C - Ward Officer';
    return userData?.role;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <DashboardLayout navigation={navigation} title={`${userData?.role?.replace('_', ' ').toUpperCase()} Officer`}>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>

        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        {/* Profile Info */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <Input
                label="Full Name"
                name="name"
                value={profileData.name}
                onChange={handleProfileChange}
                required
              />
              
              <Input
                label="Email"
                value={userData?.email || ''}
                disabled
                className="bg-gray-50"
              />
              
              <Input
                label="Phone Number"
                name="phone"
                value={profileData.phone}
                onChange={handleProfileChange}
              />

              <Input
                label="Employee ID"
                value={profileData.employee_id}
                disabled
                className="bg-gray-50"
              />

              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Assignment Info */}
        <Card>
          <CardHeader>
            <CardTitle>Assignment Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Role</span>
                <Badge variant="primary">{getRoleLabel()}</Badge>
              </div>
              
              {userData?.department && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Department</span>
                  <span className="font-medium">{getDepartmentName(userData.department)}</span>
                </div>
              )}
              
              {userData?.ward_id && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Assigned Ward</span>
                  <span className="font-medium">{getWardName(userData.ward_id)}</span>
                </div>
              )}
              
              {userData?.zone && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Zone</span>
                  <span className="font-medium">{userData.zone}</span>
                </div>
              )}

              <p className="text-sm text-gray-500">
                Contact HR department to update your assignment details.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Account Status</span>
                <Badge variant={userData?.active ? 'success' : 'danger'}>
                  {userData?.active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Verification Status</span>
                <Badge variant={userData?.verified ? 'success' : 'warning'}>
                  {userData?.verified ? 'Verified' : 'Pending'}
                </Badge>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Member Since</span>
                <span className="font-medium">
                  {userData?.created_at 
                    ? new Date(userData.created_at).toLocaleDateString()
                    : 'N/A'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Permissions */}
        <Card>
          <CardHeader>
            <CardTitle>Permissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {isClassA && (
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>✅ Full system access</li>
                  <li>✅ Manage all departments</li>
                  <li>✅ User management</li>
                  <li>✅ SLA configuration</li>
                  <li>✅ Analytics & reporting</li>
                </ul>
              )}
              {isClassB && (
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>✅ Department-level access</li>
                  <li>✅ Manage work orders</li>
                  <li>✅ Contractor management</li>
                  <li>✅ Team management</li>
                  <li>✅ Budget allocation</li>
                </ul>
              )}
              {isClassC && (
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>✅ Ward-level access</li>
                  <li>✅ Report validation</li>
                  <li>✅ Work order creation</li>
                  <li>✅ Contractor assignment</li>
                  <li>✅ Field verification</li>
                </ul>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <Input
                label="Current Password"
                name="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                required
              />
              
              <Input
                label="New Password"
                name="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                required
              />
              
              <Input
                label="Confirm New Password"
                name="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                required
              />

              <Button type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
