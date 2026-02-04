'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { Button, Card, CardContent } from '@/components/ui';
import { CATEGORIES_LIST } from '@/lib/constants/sla';
import Preloader from '@/components/Preloader';
import Hero3D from '@/components/Hero3D';

export default function Home() {
  const router = useRouter();
  const { user, userData, loading } = useAuth();
  const [showPreloader, setShowPreloader] = useState(true);

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

  // Show preloader on first load
  if (showPreloader) {
    return <Preloader onComplete={() => setShowPreloader(false)} />;
  }

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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-40 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <motion.div 
              className="flex items-center space-x-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Image 
                src="/logo.svg" 
                alt="CASE Logo" 
                width={48} 
                height={48}
                className="drop-shadow-md"
              />
              <div>
                <h1 className="text-xl font-bold text-slate-800">
                  CASE Platform
                </h1>
                <p className="text-sm text-slate-600">Civic Action & Service Excellence</p>
              </div>
            </motion.div>
            <motion.div 
              className="flex space-x-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Link href="/auth/login">
                <Button variant="outline" className="hover:border-indigo-600 hover:text-indigo-600 transition-all">
                  Login
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-md">
                  Register
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Hero Section with 3D Animation */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        <Hero3D />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-50 via-white to-green-50 border-2 border-orange-500 rounded-full mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <svg className="w-5 h-5 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <span className="text-sm font-bold bg-gradient-to-r from-orange-600 via-blue-900 to-green-600 bg-clip-text text-transparent">Built in Bharat 🇮🇳</span>
              <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </motion.div>
            
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-6 leading-tight">
              Empowering Citizens,
              <br />
              <span className="bg-gradient-to-r from-orange-500 via-blue-900 to-green-600 bg-clip-text text-transparent">
                Transforming Cities
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed">
              Real-time civic issue reporting and resolution platform.
              Join thousands making cities smarter and more responsive.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/auth/register">
                <Button size="lg" className="px-8 py-6 text-lg bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700 shadow-xl shadow-orange-500/30">
                  Report an Issue
                </Button>
              </Link>
              <Link href="/track">
                <Button variant="outline" size="lg" className="px-8 py-6 text-lg border-2 hover:border-orange-500 hover:text-orange-600">
                  Track Status
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white pointer-events-none" />
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              What is <span className="bg-gradient-to-r from-orange-500 via-blue-900 to-green-600 bg-clip-text text-transparent">CASE</span>?
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              A comprehensive civic engagement platform built for modern municipalities
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8 mb-20">
            {[
              { title: 'CAPTURE', desc: 'Real-time civic issue detection with geo-tagging and media support', svg: <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>, color: 'from-orange-400 to-orange-600' },
              { title: 'ASSESS', desc: 'AI-powered priority analysis and intelligent department routing', svg: <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>, color: 'from-slate-400 to-slate-600' },
              { title: 'SERVE', desc: 'Swift municipal response with transparent workflow tracking', svg: <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>, color: 'from-green-400 to-green-600' },
              { title: 'EVOLVE', desc: 'Continuous improvement through data-driven insights', svg: <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 6l-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/></svg>, color: 'from-blue-700 to-blue-900' }
            ].map((item, idx) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.6 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="relative group"
              >
                <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 h-full hover:border-orange-200 hover:shadow-2xl transition-all duration-300">
                  <div className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center mb-4 shadow-lg text-white`}>
                    {item.svg}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h3 className="text-3xl font-bold text-slate-900 mb-8">Report Across All Departments</h3>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {CATEGORIES_LIST.slice(0, 12).map((category, idx) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ scale: 1.1 }}
              >
                <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-orange-400">
                  <CardContent className="pt-6 text-center">
                    <span className="text-4xl mb-2 block">{category.icon}</span>
                    <p className="text-sm font-medium text-slate-700">{category.name}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2 
            className="text-4xl font-bold text-center text-slate-900 mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            How It Works
          </motion.h2>
          
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { num: '01', title: 'Report', desc: 'Submit issues with photos and precise location', icon: '📝', color: 'blue' },
              { num: '02', title: 'Validate', desc: 'Officers review and prioritize reports', icon: '✅', color: 'green' },
              { num: '03', title: 'Assign', desc: 'Smart contractor allocation and dispatch', icon: '👷', color: 'orange' },
              { num: '04', title: 'Resolve', desc: 'Track resolution and verify completion', icon: '🏆', color: 'purple' }
            ].map((step, idx) => (
              <motion.div
                key={step.num}
                className="text-center relative"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15 }}
              >
                <div className="relative mb-6">
                  <div className={`w-24 h-24 bg-gradient-to-br from-${step.color}-500 to-${step.color}-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl transform hover:scale-110 transition-transform`}>
                    <span className="text-4xl">{step.icon}</span>
                  </div>
                  <div className="absolute -top-2 -right-2 w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {step.num}
                  </div>
                </div>
                <h3 className="font-bold text-xl mb-3 text-slate-900">{step.title}</h3>
                <p className="text-slate-600 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-orange-500 via-white to-green-600 text-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, #000080 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="grid md:grid-cols-4 gap-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {[
              { value: '227', label: 'Wards (BMC)', icon: '🗺️', desc: 'Greater Mumbai' },
              { value: '24', label: 'Departments', icon: '🏢', desc: 'Municipal Services' },
              { value: '12.5M+', label: 'Population', icon: '👥', desc: 'Citizens Served' },
              { value: '437 km²', label: 'Area Coverage', icon: '📍', desc: 'Mumbai City' }
            ].map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ scale: 1.1 }}
                className="group"
              >
                <div className="text-5xl mb-3 group-hover:scale-125 transition-transform">{stat.icon}</div>
                <p className="text-5xl font-black mb-2 text-blue-900">{stat.value}</p>
                <p className="text-slate-700 text-lg font-semibold">{stat.label}</p>
                <p className="text-slate-500 text-sm mt-1">{stat.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Ready to Make a Difference?
            </h2>
            <p className="text-xl text-slate-600 mb-10 leading-relaxed">
              Join the movement to build smarter, more responsive cities.
              Register now and start reporting civic issues in your area.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/auth/register">
                <Button size="lg" className="px-8 py-6 text-lg bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700 shadow-xl">
                  Register as Citizen
                </Button>
              </Link>
              <Link href="/auth/register/contractor">
                <Button variant="outline" size="lg" className="px-8 py-6 text-lg border-2 hover:border-orange-500 hover:text-orange-600">
                  Register as Contractor
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <Image 
                  src="/logo.svg" 
                  alt="CASE Logo" 
                  width={40} 
                  height={40}
                />
                <h3 className="font-bold text-xl">CASE</h3>
              </div>
              <p className="text-slate-400 leading-relaxed mb-4">
                Civic Action & Service Excellence platform for modern municipalities.
              </p>
              <div className="flex items-center gap-2 text-sm">
                <svg className="w-5 h-5 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <span className="bg-gradient-to-r from-orange-500 via-blue-900 to-green-600 bg-clip-text text-transparent font-bold">Built in Bharat 🇮🇳</span>
                <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
              <ul className="space-y-3 text-slate-400">
                <li><Link href="/auth/login" className="hover:text-white transition-colors">Login</Link></li>
                <li><Link href="/auth/register" className="hover:text-white transition-colors">Register</Link></li>
                <li><Link href="/track" className="hover:text-white transition-colors">Track Report</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-4">For Officials</h3>
              <ul className="space-y-3 text-slate-400">
                <li><Link href="/auth/register/officer" className="hover:text-white transition-colors">Officer Registration</Link></li>
                <li><Link href="/auth/login" className="hover:text-white transition-colors">Officer Login</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-4">Contact</h3>
              <ul className="space-y-3 text-slate-400">
                <li>24/7 Support Helpline</li>
                <li>support@case.gov.in</li>
                <li>Municipal Corporation Office</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-slate-400 text-sm">
                © 2026 CASE Platform. All rights reserved.
              </p>
              <p className="text-slate-400 text-sm">
                Designed & Developed by <span className="text-white font-semibold">Coding Gurus</span>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
