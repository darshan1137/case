'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, EyeOff, AlertCircle, X, Mail, Lock, Loader2 } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { updateUserData } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDevUsers, setShowDevUsers] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  const devUsers = [
    { email: 'alfiyasiddique1708@gmail.com', password: '123456', role: 'Citizen' },
    { email: 'contractor@demo.com', password: 'demo123', role: 'Contractor' },
    { email: 'officer.c@demo.com', password: 'demo123', role: 'Class C Officer' },
    { email: 'darshankhapekar8520@gmail.com', password: '123456', role: 'Class B Officer' },
    { email: 'admin@demo.com', password: 'demo123', role: 'Admin' }
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleQuickLogin = (email, password) => {
    setFormData({ email, password });
    setShowDevUsers(false);
    setError('');
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
      console.log(data)

      if (!data.success) {
        const errorMessage = data.error || 'Login failed';
        if (errorMessage.includes('not found')) {
          setError('No account found with this email address.');
        } else if (errorMessage.includes('password')) {
          setError('Incorrect password. Please try again.');
        } else if (errorMessage.includes('disabled')) {
          setError('This account has been disabled. Please contact support.');
        } else {
          setError(errorMessage);
        }
        setLoading(false);
        return;
      }

      if (data.token) {
        localStorage.setItem('authToken', data.token);
      }

      if (data.user) {
        localStorage.setItem('userData', JSON.stringify(data.user));
        // Update AuthContext immediately
        updateUserData(data.user);
      }

      const role = data.user?.role;
      switch (role) {
        case 'citizen':
          router.push('/citizen/dashboard');
          break;
        case 'contractor':
          router.push('/contractor/dashboard');
          break;
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
      setError('Network error. Please check your connection and try again.');
      console.error(err);
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <>
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .fade-in { opacity: 0; transform: translateY(20px); transition: opacity 0.6s ease-out, transform 0.6s ease-out; }
        .fade-in-active { opacity: 1; transform: translateY(0); }
        .input-pulse { animation: pulse 0.6s ease-in-out; }
        .shake { animation: shake 0.5s ease-in-out; }
        .gov-stripe { background: linear-gradient(90deg, #ff9933 33.33%, #ffffff 33.33%, #ffffff 66.66%, #138808 66.66%); height: 4px; }
        .hover-lift { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .hover-lift:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); }
      `}</style>

      <div className="min-h-screen flex items-center justify-center bg-cover bg-center relative" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1920')" }}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/90 via-indigo-50/80 to-blue-50/75 backdrop-blur-sm"></div>
        <div className="absolute top-0 left-0 right-0 gov-stripe"></div>

        <div className="relative z-10 w-full max-w-4xl bg-white rounded-2xl shadow-2xl border-2 border-indigo-100 overflow-hidden flex flex-col md:flex-row">
          {/* Login Form Section */}
          <div id="login-section" className="md:w-7/12 w-full p-8 bg-white fade-in fade-in-active">
            <div className="flex items-center gap-2 mb-6">
              <div className="h-1 w-10 bg-indigo-600"></div>
              <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wide">User Login</h2>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-md shake flex items-start">
                <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
                <button onClick={() => setError('')} className="ml-3 text-red-500 hover:text-red-700">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-gray-700 text-xs font-semibold mb-2 uppercase tracking-wide">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className={`w-full border-2 rounded-lg pl-11 pr-4 py-3 text-sm text-gray-800 focus:outline-none transition-all ${
                      error ? 'border-red-400 focus:border-red-600 focus:ring-2 focus:ring-red-200' : 'border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200'
                    }`}
                    placeholder="official.email@domain.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 text-xs font-semibold mb-2 uppercase tracking-wide">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className={`w-full border-2 rounded-lg pl-11 pr-12 py-3 text-sm text-gray-800 focus:outline-none transition-all ${
                      error ? 'border-red-400 focus:border-red-600 focus:ring-2 focus:ring-red-200' : 'border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200'
                    }`}
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <Link href="/auth/forgot-password" className="text-indigo-600 hover:text-indigo-700 font-medium">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={!formData.email || !formData.password || loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold py-3 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg uppercase tracking-wide text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Dev Users Quick Access */}
            <div className="mt-6 bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
              <button
                type="button"
                onClick={() => setShowDevUsers(!showDevUsers)}
                className="w-full text-xs font-bold text-gray-600 text-center uppercase tracking-wide hover:text-indigo-600 transition-colors"
              >
                {showDevUsers ? 'Hide' : 'Show'} Demo Accounts
              </button>
              {showDevUsers && (
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {devUsers.map((user) => (
                    <button
                      key={user.email}
                      onClick={() => { setFormData({ email: user.email, password: user.password }); setError(''); }}
                      className="px-3 py-2 rounded-lg bg-white hover:bg-indigo-50 border border-gray-300 hover:border-indigo-400 text-gray-700 hover:text-indigo-700 transition-all text-xs font-medium hover-lift"
                    >
                      {user.role}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Register Link */}
            <div className="mt-6 text-center text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <Link href="/auth/register" className="text-indigo-600 hover:text-indigo-700 font-semibold">
                Register here
              </Link>
            </div>
          </div>

          {/* Branding Section */}
          <div id="brand-section" className="md:w-5/12 w-full bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-700 flex flex-col items-center justify-center text-center p-8 relative fade-in fade-in-active">
            <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9IndoaXRlIi8+PC9zdmc+')] bg-repeat"></div>

            <div className="mb-6 relative z-10">
              <Image src="/logo.svg" alt="CASE Logo" width={120} height={120} className="drop-shadow-2xl" />
            </div>

            <h1 className="text-4xl font-bold text-white tracking-tight mb-3 relative z-10">
              CASE Platform
            </h1>

            <div className="h-1 w-20 bg-gradient-to-r from-orange-400 via-white to-green-400 mb-4"></div>

            <p className="text-indigo-100 text-sm leading-relaxed max-w-xs relative z-10 mb-6">
              Civic Action & Service Excellence
              <br />
              Empowering communities through digital governance
            </p>

            <div className="space-y-3 relative z-10">
              <div className="flex items-center gap-3 text-white text-left">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm">Real-time issue reporting</p>
              </div>
              <div className="flex items-center gap-3 text-white text-left">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <p className="text-sm">Swift municipal response</p>
              </div>
              <div className="flex items-center gap-3 text-white text-left">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="text-sm">Data-driven insights</p>
              </div>
            </div>

            <div className="mt-8 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 relative z-10">
              <p className="text-xs font-bold text-white uppercase tracking-widest">Municipal Services</p>
            </div>
          </div>
        </div>

        <div className="absolute bottom-4 left-0 right-0 text-center text-xs text-gray-600">
          <p>© 2024 CASE Platform | Designed & Developed by <span className="font-semibold">Coding Gurus</span></p>
        </div>

        <div className="absolute bottom-4 left-0 right-0 text-center text-xs text-gray-600">
          <p>© 2024 CASE Platform | Designed & Developed by <span className="font-semibold">Coding Gurus</span></p>
        </div>
      </div>
    </>
  );
}
