'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/components/layout';
import ChangePasswordForm from '@/components/ChangePasswordForm';

const navigation = [
  { name: 'Dashboard', href: '/contractor/dashboard', icon: '📊' },
  { name: 'Assigned Tickets', href: '/contractor/tickets', icon: '🎫' },
  { name: 'Jobs', href: '/contractor/jobs', icon: '📋' },
  { name: 'Profile', href: '/contractor/profile', icon: '👤' },
  { name: 'Change Password', href: '/contractor/change-password', icon: '🔐' },
];

export default function ContractorChangePasswordPage() {
  const router = useRouter();
  const { userData, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;

    if (userData?.role !== 'contractor') {
      router.push('/auth/login');
      return;
    }
  }, [userData, authLoading, router]);

  const handleSuccess = () => {
    // Optionally redirect to dashboard after successful password change
    setTimeout(() => {
      router.push('/contractor/dashboard');
    }, 2000);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <DashboardLayout navigation={navigation}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <Link href="/contractor/dashboard" className="text-blue-600 hover:text-blue-700 text-sm">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Security Settings</h1>
          <p className="text-gray-600 mt-1">Manage your account password and security preferences</p>
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
              Account Security Best Practices
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Change your password regularly (every 90 days recommended)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Never share your password with anyone, including CASE support staff</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Use different passwords for different accounts</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Log out from shared or public devices after use</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Report any suspicious activity to the administrator immediately</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
