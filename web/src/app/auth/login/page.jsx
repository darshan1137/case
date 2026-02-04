'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Button, Input, Alert, AlertDescription } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDevUsers, setShowDevUsers] = useState(false);

  const devUsers = [
    { email: 'citizen@demo.com', password: 'demo123', role: 'Citizen' },
    { email: 'contractor@demo.com', password: 'demo123', role: 'Contractor' },
    { email: 'officer.c@demo.com', password: 'demo123', role: 'Class C Officer' },
    { email: 'officer.b@demo.com', password: 'demo123', role: 'Class B Officer' },
    { email: 'admin@demo.com', password: 'demo123', role: 'Admin' }
  ];

  const handleQuickLogin = (email, password) => {
    setFormData({ email, password });
    setShowDevUsers(false);
    // Auto-submit after filling
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) {
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    }, 100);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Call the login API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      // Store auth token if provided
      if (data.token) {
        localStorage.setItem('authToken', data.token);
      }

      // Store user data
      if (data.user) {
        localStorage.setItem('userData', JSON.stringify(data.user));
      }

      // Redirect based on role
      const role = data.user?.role;
      switch (role) {
        case 'citizen':
          router.push('/citizen/dashboard');
          break;
        case 'contractor':
          router.push('/contractor/dashboard');
          break;
        case 'class_c':
        case 'class_b':
        case 'class_a':
        case 'officer':
          router.push('/officer/dashboard');
          break;
        case 'admin':
          router.push('/admin/dashboard');
          break;
        default:
          setError('Invalid user role. Please contact support.');
          setLoading(false);
          return;
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="flex w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden" style={{ maxHeight: '90vh' }}>
        {/* Left Side - Brand & Info (Book Cover) */}
        <motion.div 
          className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 p-12 flex-col justify-between relative overflow-hidden"
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
        {/* Decorative Background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        <div className="relative z-10">

          {/* Logo */}
          <motion.div 
            className="flex items-center space-x-3 mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Image 
              src="/logo.svg" 
              alt="CASE Logo" 
              width={56} 
              height={56}
              className="drop-shadow-lg"
            />
            <div>
              <h1 className="text-white text-2xl font-bold">CASE Platform</h1>
              <p className="text-indigo-100 text-sm">Civic Action & Service Excellence</p>
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-white text-5xl font-bold mb-6 leading-tight">
              Welcome Back to
              <br />
              <span className="text-amber-300">Smart Governance</span>
            </h2>
            
            <p className="text-indigo-100 text-lg mb-8 leading-relaxed">
              Access your dashboard and continue making a difference in your community.
            </p>

            {/* Feature Highlights */}
            <div className="space-y-4">
              {[
                { icon: '📸', title: 'Capture', desc: 'Report civic issues instantly' },
                { icon: '🎯', title: 'Assess', desc: 'AI-powered prioritization' },
                { icon: '⚡', title: 'Serve', desc: 'Swift municipal response' },
                { icon: '📈', title: 'Evolve', desc: 'Data-driven improvements' }
              ].map((feature, idx) => (
                <motion.div
                  key={feature.title}
                  className="flex items-center space-x-4 bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + idx * 0.1 }}
                >
                  <span className="text-3xl">{feature.icon}</span>
                  <div>
                    <h4 className="text-white font-semibold">{feature.title}</h4>
                    <p className="text-indigo-100 text-sm">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Built in Bharat Badge */}
          <motion.div
            className="flex items-center gap-2 text-amber-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10" opacity="0.2"/>
              <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z"/>
              <circle cx="12" cy="12" r="3" fill="currentColor"/>
            </svg>
            <span className="font-medium">Built in Bharat</span>
          </motion.div>
        </div>
      </motion.div>

      {/* Right Side - Login Form (Book Page) */}
      <div className="w-full lg:w-3/5 flex items-center justify-center p-8 overflow-y-auto" style={{ maxHeight: '90vh' }}>
        <motion.div
          className="w-full max-w-md"
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center mb-8">
            <Image 
              src="/logo.svg" 
              alt="CASE Logo" 
              width={48} 
              height={48}
            />
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Sign In</h2>
            <p className="text-slate-600">Access your CASE account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="error">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                Email Address
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
                className="h-12"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
                className="h-12"
              />
            </div>

            <div className="flex items-center justify-between">
              <Link href="/auth/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                Forgot password?
              </Link>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-base font-semibold" 
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>

            {/* Dev Users Section */}
            <div className="pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowDevUsers(!showDevUsers)}
                className="text-sm text-slate-600 hover:text-indigo-600 font-medium w-full text-center"
              >
                {showDevUsers ? 'Hide' : 'Show'} Demo Accounts
              </button>
              
              {showDevUsers && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 space-y-2"
                >
                  {devUsers.map((user, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleQuickLogin(user.email, user.password)}
                      className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-lg transition-all group"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{user.role}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Quick Login</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </div>

            <div className="text-center pt-4">
              <p className="text-sm text-slate-600">
                Don't have an account?{' '}
                <Link href="/auth/register" className="text-indigo-600 hover:text-indigo-700 font-semibold">
                  Register here
                </Link>
              </p>
            </div>

            <div className="text-center pt-2 border-t border-slate-200">
              <p className="text-xs text-slate-500 mb-2">For Officer/Contractor accounts:</p>
              <div className="flex justify-center gap-4 text-xs">
                <Link href="/auth/register/officer" className="text-indigo-600 hover:text-indigo-700 font-medium">
                  Officer Registration
                </Link>
                <span className="text-slate-300">|</span>
                <Link href="/auth/register/contractor" className="text-indigo-600 hover:text-indigo-700 font-medium">
                  Contractor Registration
                </Link>
              </div>
            </div>
          </form>

          {/* Footer Credit */}
          <div className="mt-12 text-center text-xs text-slate-400">
            <p>Designed & Developed by <span className="font-semibold text-slate-600">Coding Gurus</span></p>
          </div>
        </motion.div>
      </div>
      </div>
    </div>
  );
}