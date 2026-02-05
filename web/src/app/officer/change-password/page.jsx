'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/components/layout';
import ChangePasswordForm from '@/components/ChangePasswordForm';

export default function OfficerChangePasswordPage() {
  const router = useRouter();
  const { userData, loading: authLoading } = useAuth();

  const isClassA = userData?.class === 'class_a';
  const isClassB = userData?.class === 'class_b';
  const isClassC = userData?.class === 'class_c';

  // Only Class B and Class C can access this page
  const canAccessPage = isClassB || isClassC;

  const navigation = [
    { name: 'Dashboard', href: '/officer/dashboard', icon: '📊' },
    { name: 'Reports', href: '/officer/reports', icon: '📋' },
    { name: 'Tickets', href: '/officer/tickets', icon: '🎫' },
    { name: 'Work Orders', href: '/officer/work-orders', icon: '🔧' },
    { name: 'Contractors', href: '/officer/contractors', icon: '👷' },
    { name: 'Assets', href: '/officer/assets', icon: '🏗️' },
    { name: 'Analytics', href: '/officer/analytics', icon: '📈' },
    ...(isClassB || isClassA ? [
      { name: 'Team', href: '/officer/team', icon: '👥' },
      { name: 'Budgets', href: '/officer/budgets', icon: '💰' },
    ] : []),
    { name: 'Profile', href: '/officer/profile', icon: '👤' },
    ...(canAccessPage ? [
      { name: 'Change Password', href: '/officer/change-password', icon: '🔐' },
    ] : []),
  ];

  useEffect(() => {
    if (authLoading) return;

    if (userData?.role !== 'officer') {
      router.push('/auth/login');
      return;
    }

    // Check if user has permission
    if (!canAccessPage) {
      router.push('/officer/dashboard');
      return;
    }
  }, [userData, authLoading, router, canAccessPage]);

  const handleSuccess = () => {
    // Optionally redirect to dashboard after successful password change
    setTimeout(() => {
      router.push('/officer/dashboard');
    }, 2000);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!canAccessPage) {
    return (
      <DashboardLayout navigation={navigation}>
        <div className="p-6">
          <div className="text-center py-12">
            <span className="text-6xl">⚠️</span>
            <h2 className="text-xl font-semibold text-gray-900 mt-4">Access Denied</h2>
            <p className="text-gray-600 mt-2">
              This feature is only available for Class B and Class C officers.
            </p>
            <Link href="/officer/dashboard">
              <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Back to Dashboard
              </button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navigation={navigation}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <Link href="/officer/dashboard" className="text-blue-600 hover:text-blue-700 text-sm">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Security Settings</h1>
          <p className="text-gray-600 mt-1">
            Manage your account password and security preferences
          </p>
          <div className="mt-2">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              <span>👮</span>
              {isClassB ? 'Class B Officer' : 'Class C Officer'}
            </span>
          </div>
        </div>

        {/* Change Password Form */}
        <ChangePasswordForm 
          userId={userData?.id || userData?.uid}
          userEmail={userData?.email}
          onSuccess={handleSuccess}
        />

        {/* Additional Security Info */}
        <div className="max-w-2xl">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="text-xl">🛡️</span>
              Officer Account Security Best Practices
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Change your password regularly (every 90 days recommended)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Never share your password with anyone, including other officers or support staff</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Use a unique strong password different from other accounts</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Always log out when using shared government workstations</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Report any suspicious activity or unauthorized access immediately</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Be cautious of phishing emails claiming to be from CASE platform</span>
              </li>
            </ul>
          </div>

          {/* Role-Specific Notice */}
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex gap-3">
              <span className="text-amber-600 text-lg">⚠️</span>
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Important Notice for Officers:</p>
                <p>
                  As a government officer with access to sensitive citizen data and municipal operations,
                  maintaining strong password security is critical. Any security breach could compromise
                  public trust and municipal services. Please follow all security guidelines diligently.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
