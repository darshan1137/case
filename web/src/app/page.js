'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button, Card, CardContent } from '@/components/ui';
import { CATEGORIES_LIST } from '@/lib/constants/sla';

export default function Home() {
  const router = useRouter();
  const { user, userData, loading } = useAuth();

  useEffect(() => {
    // Redirect authenticated users to their dashboard
    if (!loading && user && userData) {
      const dashboardRoutes = {
        citizen: '/citizen/dashboard',
        contractor: '/contractor/dashboard',
        class_c: '/officer/dashboard',
        class_b: '/officer/dashboard',
        class_a: '/admin/dashboard'
      };
      const route = dashboardRoutes[userData.role];
      if (route) {
        router.push(route);
      }
    }
  }, [user, userData, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If logged in, show loading until redirect
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">🏛️</span>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Municipal Corporation</h1>
                <p className="text-sm text-gray-500">City Infrastructure Management</p>
              </div>
            </div>
            <div className="flex space-x-4">
              <Link href="/auth/login">
                <Button variant="outline">Login</Button>
              </Link>
              <Link href="/auth/register">
                <Button>Register</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Your City, Your Voice
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
            Report civic issues, track their resolution, and help make our city better.
            Join thousands of citizens contributing to urban improvement.
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/auth/register">
              <Button size="lg" className="px-8 py-6 text-lg">
                <span className="mr-2">📝</span>
                Report an Issue
              </Button>
            </Link>
            <Link href="/track">
              <Button variant="outline" size="lg" className="px-8 py-6 text-lg">
                <span className="mr-2">🔍</span>
                Track Status
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Report Issues Across Departments
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {CATEGORIES_LIST.slice(0, 12).map((category) => (
              <Card key={category.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="pt-6 text-center">
                  <span className="text-4xl">{category.icon}</span>
                  <p className="text-sm font-medium text-gray-700 mt-2">{category.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📝</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">1. Report</h3>
              <p className="text-gray-600">Submit your issue with photos and location</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✅</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">2. Validate</h3>
              <p className="text-gray-600">Officers review and validate the report</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">👷</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">3. Assign</h3>
              <p className="text-gray-600">Contractors are assigned to fix the issue</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🏆</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">4. Resolve</h3>
              <p className="text-gray-600">Issue resolved and verified</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-4xl font-bold">21</p>
              <p className="text-blue-100">Departments</p>
            </div>
            <div>
              <p className="text-4xl font-bold">76</p>
              <p className="text-blue-100">Wards</p>
            </div>
            <div>
              <p className="text-4xl font-bold">24/7</p>
              <p className="text-blue-100">Support</p>
            </div>
            <div>
              <p className="text-4xl font-bold">48h</p>
              <p className="text-blue-100">Avg Response</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Ready to Make a Difference?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Register now and start reporting civic issues in your area.
            Together, we can build a better city.
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/auth/register">
              <Button size="lg">Register as Citizen</Button>
            </Link>
            <Link href="/auth/register/contractor">
              <Button variant="outline" size="lg">Register as Contractor</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold mb-4">Municipal Corporation</h3>
              <p className="text-gray-400 text-sm">
                City Infrastructure Management System for efficient civic service delivery.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/auth/login" className="hover:text-white">Login</Link></li>
                <li><Link href="/auth/register" className="hover:text-white">Register</Link></li>
                <li><Link href="/track" className="hover:text-white">Track Report</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">For Officials</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/auth/register/officer" className="hover:text-white">Officer Registration</Link></li>
                <li><Link href="/auth/login" className="hover:text-white">Officer Login</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Contact</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>📞 1800-XXX-XXXX</li>
                <li>📧 support@municipal.gov.in</li>
                <li>🏛️ City Hall, Main Road</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
            © 2025 Municipal Corporation. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
