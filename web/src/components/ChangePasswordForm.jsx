'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Alert } from '@/components/ui';

/**
 * Reusable Change Password Component
 * Supports Contractors, Class B Officers, and Class C Officers
 * 
 * @param {Object} props
 * @param {string} props.userId - Current user's ID
 * @param {string} props.userEmail - Current user's email (for Firebase Auth)
 * @param {Function} props.onSuccess - Callback after successful password change
 */
export default function ChangePasswordForm({ userId, userEmail, onSuccess }) {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');
  const [apiError, setApiError] = useState('');

  // Password strength calculation
  const calculatePasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    strength = Object.values(checks).filter(Boolean).length;

    const strengthMap = {
      0: { label: 'Very Weak', color: 'bg-red-500', textColor: 'text-red-600' },
      1: { label: 'Weak', color: 'bg-red-400', textColor: 'text-red-600' },
      2: { label: 'Fair', color: 'bg-yellow-500', textColor: 'text-yellow-600' },
      3: { label: 'Good', color: 'bg-blue-500', textColor: 'text-blue-600' },
      4: { label: 'Strong', color: 'bg-green-500', textColor: 'text-green-600' },
      5: { label: 'Very Strong', color: 'bg-green-600', textColor: 'text-green-600' }
    };

    return {
      strength,
      label: strengthMap[strength].label,
      color: strengthMap[strength].color,
      textColor: strengthMap[strength].textColor,
      percentage: (strength / 5) * 100,
      checks
    };
  };

  const passwordStrength = calculatePasswordStrength(formData.newPassword);

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    } else if (passwordStrength.strength < 3) {
      newErrors.newPassword = 'Password is too weak. Include uppercase, lowercase, numbers, and special characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (formData.currentPassword && formData.newPassword && formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    setApiError('');
    setSuccess('');
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setApiError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          email: userEmail,
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      setSuccess('Password changed successfully! You can now use your new password to sign in.');
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      if (onSuccess) {
        setTimeout(() => onSuccess(), 2000);
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setApiError(error.message || 'Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">🔐</span>
          <span>Change Password</span>
        </CardTitle>
        <p className="text-sm text-gray-600 mt-2">
          Update your password to keep your account secure
        </p>
      </CardHeader>
      <CardContent className="pt-6">
        {success && (
          <Alert variant="success" className="mb-6">
            <div className="flex items-start gap-2">
              <span className="text-xl">✓</span>
              <div>
                <p className="font-medium">Success!</p>
                <p className="text-sm mt-1">{success}</p>
              </div>
            </div>
          </Alert>
        )}

        {apiError && (
          <Alert variant="danger" className="mb-6">
            <div className="flex items-start gap-2">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="font-medium">Error</p>
                <p className="text-sm mt-1">{apiError}</p>
              </div>
            </div>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPasswords.current ? 'text' : 'password'}
                value={formData.currentPassword}
                onChange={(e) => handleChange('currentPassword', e.target.value)}
                className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                  errors.currentPassword ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your current password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('current')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                tabIndex={-1}
              >
                {showPasswords.current ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.currentPassword}</p>
            )}
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPasswords.new ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={(e) => handleChange('newPassword', e.target.value)}
                className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                  errors.newPassword ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your new password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('new')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                tabIndex={-1}
              >
                {showPasswords.new ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.newPassword}</p>
            )}

            {/* Password Strength Indicator */}
            {formData.newPassword && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">Password Strength:</span>
                  <span className={`text-xs font-medium ${passwordStrength.textColor}`}>
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                    style={{ width: `${passwordStrength.percentage}%` }}
                  />
                </div>
                <div className="mt-2 space-y-1 text-xs">
                  <div className={`flex items-center gap-1 ${passwordStrength.checks.length ? 'text-green-600' : 'text-gray-400'}`}>
                    {passwordStrength.checks.length ? '✓' : '○'} At least 8 characters
                  </div>
                  <div className={`flex items-center gap-1 ${passwordStrength.checks.uppercase ? 'text-green-600' : 'text-gray-400'}`}>
                    {passwordStrength.checks.uppercase ? '✓' : '○'} Uppercase letter
                  </div>
                  <div className={`flex items-center gap-1 ${passwordStrength.checks.lowercase ? 'text-green-600' : 'text-gray-400'}`}>
                    {passwordStrength.checks.lowercase ? '✓' : '○'} Lowercase letter
                  </div>
                  <div className={`flex items-center gap-1 ${passwordStrength.checks.number ? 'text-green-600' : 'text-gray-400'}`}>
                    {passwordStrength.checks.number ? '✓' : '○'} Number
                  </div>
                  <div className={`flex items-center gap-1 ${passwordStrength.checks.special ? 'text-green-600' : 'text-gray-400'}`}>
                    {passwordStrength.checks.special ? '✓' : '○'} Special character
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                  errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Confirm your new password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('confirm')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                tabIndex={-1}
              >
                {showPasswords.confirm ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
            )}
            {formData.confirmPassword && formData.newPassword === formData.confirmPassword && (
              <p className="text-green-600 text-sm mt-1 flex items-center gap-1">
                <span>✓</span> Passwords match
              </p>
            )}
          </div>

          {/* Security Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <span className="text-blue-600 text-lg">ℹ️</span>
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Security Tips:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Use a unique password not used on other sites</li>
                  <li>Avoid personal information like names or dates</li>
                  <li>Consider using a password manager</li>
                  <li>You&apos;ll receive an email confirmation after changing your password</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Changing Password...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span>🔐</span>
                  Change Password
                </span>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
