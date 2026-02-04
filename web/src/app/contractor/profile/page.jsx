'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Select, Alert, Badge } from '@/components/ui';
import { userService } from '@/lib/userService';
import { CONTRACTOR_SERVICE_TYPES } from '@/lib/constants';
import { WARDS_LIST } from '@/lib/constants/wards';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const navigation = [
  { name: 'Dashboard', href: '/contractor/dashboard', icon: '📊' },
  { name: 'Assigned Jobs', href: '/contractor/jobs', icon: '📋' },
  { name: 'Active Jobs', href: '/contractor/jobs/active', icon: '🔨' },
  { name: 'Completed', href: '/contractor/jobs/completed', icon: '✅' },
  { name: 'Route Map', href: '/contractor/map', icon: '🗺️' },
  { name: 'Performance', href: '/contractor/performance', icon: '📈' },
  { name: 'Profile', href: '/contractor/profile', icon: '👤' },
];

export default function ContractorProfilePage() {
  const router = useRouter();
  const { user, userData, loading: authLoading } = useAuth();
  
  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    company_name: '',
    gst_number: ''
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
    if (!authLoading && userData?.role !== 'contractor') {
      router.push('/auth/login');
      return;
    }

    if (userData) {
      setProfileData({
        name: userData.name || '',
        phone: userData.phone || '',
        company_name: userData.company_name || '',
        gst_number: userData.gst_number || ''
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
        phone: profileData.phone,
        company_name: profileData.company_name,
        gst_number: profileData.gst_number
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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <DashboardLayout navigation={navigation} title="Contractor Portal">
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
                label="Company Name"
                name="company_name"
                value={profileData.company_name}
                onChange={handleProfileChange}
              />

              <Input
                label="GST Number"
                name="gst_number"
                value={profileData.gst_number}
                onChange={handleProfileChange}
              />

              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Service Types & Coverage */}
        <Card>
          <CardHeader>
            <CardTitle>Service Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Service Types</label>
                <div className="flex flex-wrap gap-2">
                  {userData?.service_types?.map((type) => (
                    <Badge key={type} variant="primary">
                      {type.replace('_', ' ').toUpperCase()}
                    </Badge>
                  )) || <span className="text-gray-400">Not specified</span>}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Coverage Areas</label>
                <div className="flex flex-wrap gap-2">
                  {userData?.coverage_areas?.map((area) => {
                    const ward = WARDS_LIST.find(w => w.id === area);
                    return (
                      <Badge key={area} variant="secondary">
                        {ward?.name || area}
                      </Badge>
                    );
                  }) || <span className="text-gray-400">Not specified</span>}
                </div>
              </div>

              <p className="text-sm text-gray-500">
                Contact administration to update your service types or coverage areas.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Performance Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-3xl font-bold text-yellow-600">
                  ⭐ {userData?.rating?.toFixed(1) || '0.0'}
                </p>
                <p className="text-sm text-gray-500">Rating</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-3xl font-bold text-green-600">
                  {userData?.total_jobs || 0}
                </p>
                <p className="text-sm text-gray-500">Total Jobs</p>
              </div>
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
                <span className="text-gray-500">Role</span>
                <span className="font-medium capitalize">{userData?.role}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Verification Status</span>
                <Badge variant={userData?.verified ? 'success' : 'warning'}>
                  {userData?.verified ? 'Verified' : 'Pending'}
                </Badge>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Account Status</span>
                <Badge variant={userData?.status === 'active' ? 'success' : 'danger'}>
                  {userData?.status || 'pending'}
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
