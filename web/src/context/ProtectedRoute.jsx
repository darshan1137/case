'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

/**
 * HOC to protect routes based on authentication and role
 * @param {Component} WrappedComponent - The component to wrap
 * @param {Object} options - Protection options
 * @param {string[]} options.allowedRoles - Array of roles allowed to access
 * @param {string} options.redirectTo - Redirect path if unauthorized
 */
export function withAuth(WrappedComponent, options = {}) {
  const { allowedRoles = [], redirectTo = '/auth/login' } = options;

  return function ProtectedRoute(props) {
    const { user, userData, loading, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading) {
        // Not authenticated
        if (!isAuthenticated) {
          router.push(redirectTo);
          return;
        }

        // Check role if specified
        if (allowedRoles.length > 0 && userData) {
          if (!allowedRoles.includes(userData.role)) {
            // Redirect based on their actual role
            const roleRedirects = {
              citizen: '/citizen/dashboard',
              contractor: '/contractor/dashboard',
              class_c: '/officer/dashboard',
              class_b: '/officer/dashboard',
              class_a: '/admin/dashboard',
            };
            router.push(roleRedirects[userData.role] || '/');
          }
        }
      }
    }, [loading, isAuthenticated, userData, router]);

    // Show loading state
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    // Not authenticated
    if (!isAuthenticated) {
      return null;
    }

    // Role not allowed
    if (allowedRoles.length > 0 && userData && !allowedRoles.includes(userData.role)) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
}

/**
 * Component version of route protection
 */
export function ProtectedRoute({ children, allowedRoles = [], fallback = null }) {
  const { user, userData, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return fallback;
  }

  if (allowedRoles.length > 0 && userData && !allowedRoles.includes(userData.role)) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return children;
}
