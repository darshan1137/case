'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Alert, AlertDescription } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
        case 'officer':
          router.push('/officer/dashboard');
          break;
        default:
          router.push('/');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 relative">
            <Image
              src="/logo.svg"
              alt="Municipal Corporation Logo"
              width={64}
              height={64}
              className="w-full h-full object-contain"
            />
          </div>
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to your Municipal Corporation account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="error">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
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
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
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
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <Link href="/auth/forgot-password" className="text-blue-600 hover:underline">
                Forgot password?
              </Link>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
            
            <div className="text-sm text-center text-gray-600">
              Don&apos;t have an account?{' '}
              <Link href="/auth/register" className="text-blue-600 hover:underline font-medium">
                Register here
              </Link>
            </div>

            <div className="text-xs text-center text-gray-500 pt-4 border-t">
              <p className="font-medium mb-2">For Officer/Contractor accounts:</p>
              <Link href="/auth/register/officer" className="text-blue-600 hover:underline">
                Officer Registration
              </Link>
              {' | '}
              <Link href="/auth/register/contractor" className="text-blue-600 hover:underline">
                Contractor Registration
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
