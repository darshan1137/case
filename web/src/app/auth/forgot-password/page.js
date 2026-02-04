'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authService } from '@/lib/auth';
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Alert, AlertDescription } from '@/components/ui';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const result = await authService.resetPassword(email);
      
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-2xl">✉️</span>
            </div>
            <CardTitle className="text-2xl">Check Your Email</CardTitle>
            <CardDescription>
              Password reset instructions have been sent
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              We've sent password reset instructions to <strong>{email}</strong>. 
              Please check your inbox and follow the link to reset your password.
            </p>
          </CardContent>
          <CardFooter className="justify-center">
            <Link href="/auth/login">
              <Button variant="outline">Back to Login</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-2xl">🔑</span>
          </div>
          <CardTitle className="text-2xl">Forgot Password?</CardTitle>
          <CardDescription>
            Enter your email to receive reset instructions
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
                placeholder="Enter your registered email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                required
                disabled={loading}
              />
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
            
            <Link href="/auth/login" className="text-sm text-blue-600 hover:underline">
              Back to Login
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
