'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { userService } from '@/lib/userService';
import { Button, Input, Alert, AlertDescription } from '@/components/ui';

export default function CitizenRegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
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
    if (formData.phone.length < 10) {
      setError('Please enter a valid phone number');
      return false;
    }
    // Validate phone format
    const phoneRegex = /^\+91[0-9]{10}$/;
    if (!phoneRegex.test(formData.phone)) {
      setError('Phone must be in format +91XXXXXXXXXX');
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
        name: formData.name,
        phone: formData.phone,
        role: 'citizen',
        department: null,
        ward_id: null,
        zone: null,
      });

      if (!result.success) {
        setError(result.error);
        setLoading(false);
        return;
      }

      // Redirect to citizen dashboard
      router.push('/citizen/dashboard');
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
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
              <span className="text-white text-2xl font-bold">C</span>
            </div>
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
              Join the Movement for
              <br />
              <span className="text-amber-300">Better Cities</span>
            </h2>
            
            <p className="text-indigo-100 text-lg mb-8 leading-relaxed">
              Register now and become part of a community dedicated to improving civic infrastructure.
            </p>

            {/* Benefits */}
            <div className="space-y-4">
              {[
                { icon: '🎯', title: 'Report Issues', desc: 'Submit civic problems with photos and location' },
                { icon: '📍', title: 'Track Progress', desc: 'Monitor resolution status in real-time' },
                { icon: '🤝', title: 'Community Impact', desc: 'Contribute to city-wide improvements' },
                { icon: '⭐', title: 'Recognition', desc: 'Earn badges for active participation' }
              ].map((benefit, idx) => (
                <motion.div
                  key={benefit.title}
                  className="flex items-center space-x-4 bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + idx * 0.1 }}
                >
                  <span className="text-3xl">{benefit.icon}</span>
                  <div>
                    <h4 className="text-white font-semibold">{benefit.title}</h4>
                    <p className="text-indigo-100 text-sm">{benefit.desc}</p>
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

      {/* Right Side - Register Form (Book Page) */}
      <div className="w-full lg:w-3/5 flex items-center justify-center p-8 overflow-y-auto" style={{ maxHeight: '90vh' }}>
        <motion.div
          className="w-full max-w-md"
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl font-bold">C</span>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Create Account</h2>
            <p className="text-slate-600">Register as a Citizen</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <Alert variant="error">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                Full Name
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={loading}
                className="h-11"
              />
            </div>

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
                className="h-11"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">
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
                className="h-11"
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
                placeholder="Create a password (min 6 characters)"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
                className="h-11"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={loading}
                className="h-11"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-base font-semibold mt-6" 
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>

            <div className="text-center pt-4">
              <p className="text-sm text-slate-600">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-indigo-600 hover:text-indigo-700 font-semibold">
                  Sign in
                </Link>
              </p>
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
