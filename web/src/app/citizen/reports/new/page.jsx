'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/components/layout';
import { Button, Alert } from '@/components/ui';

const navigation = [
  { name: 'Dashboard', href: '/citizen/dashboard', icon: '📊' },
  { name: 'New Report', href: '/citizen/reports/new', icon: '📝' },
  { name: 'My Reports', href: '/citizen/reports', icon: '📋' },
  { name: 'Track Status', href: '/citizen/track', icon: '🔍' },
  { name: 'Infrastructure Map', href: '/map', icon: '🗺️' },
  { name: 'Route Optimizer', href: '/route', icon: '🛣️' },
  { name: 'Profile', href: '/citizen/profile', icon: '👤' },
];

export default function NewReportPage() {
  const router = useRouter();
  const { userData, loading: authLoading } = useAuth();
  
  const [images, setImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (!authLoading && userData?.role !== 'citizen') {
      router.push('/auth/login');
    }
  }, [userData, authLoading, router]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    addImages(files);
  };

  const addImages = (files) => {
    const validFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (validFiles.length === 0) {
      setError('Please select valid image files');
      return;
    }

    if (validFiles.length + images.length > 10) {
      setError('Maximum 10 images allowed');
      return;
    }

    const newImages = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));

    setImages(prev => [...prev, ...newImages]);
    setImageFiles(prev => [...prev, ...validFiles]);
    setError('');
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files || []);
    addImages(files);
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadToCloudinary = async (file) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
    const apiSecret = process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error('Cloudinary configuration is missing. Please check your .env.local file.');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', apiKey);
    formData.append('timestamp', Math.floor(Date.now() / 1000).toString());

    // Generate signature
    const signature = await generateCloudinarySignature(
      formData.get('timestamp'),
      apiSecret
    );
    formData.append('signature', signature);
    console.log('Uploading to Cloudinary with formData:', formData);
    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to upload image to Cloudinary');
      }

      const data = await response.json();
      return data.secure_url;
    } catch (err) {
      console.error('Cloudinary upload error:', err);
      throw err;
    }
  };

  const generateCloudinarySignature = async (timestamp, apiSecret) => {
    const signatureString = `timestamp=${timestamp}${apiSecret}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(signatureString);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (imageFiles.length === 0) {
        throw new Error('Please upload at least one image of the issue');
      }

      // Prepare data for backend
      const ticketData = new FormData();
      
      // Add the file directly for validation
      if (imageFiles.length > 0) {
        ticketData.append('file', imageFiles[0]);
      }
      
      // Add metadata if available (assuming these fields exist on your form, otherwise omit)
      // ticketData.append('description', 'Validation request'); 

      console.log('Sending file for validation...');

      // Send to backend API
      const response = await fetch('http://127.0.0.1:8005/api/tickets/validate-image-only', {
        method: 'POST',
        body: ticketData,
        headers: {
          'X-User-ID': userData.uid,
          'X-User-Name': userData.name || 'Anonymous'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to submit report to server');
      }

      const result = await response.json();
      console.log('✅ Backend Response:', result);
      console.log('📋 Validation Result:', {
        detected: result.detected,
        issue_type: result.issue_type,
        confidence_score: result.confidence_score,
        severity_level: result.severity_level
      });

      // Now upload image to Cloudinary for permanent storage
      console.log('📤 Uploading image to Cloudinary...');
      const cloudinaryUrls = [];
      for (const file of imageFiles) {
        try {
          const cloudUrl = await uploadToCloudinary(file);
          cloudinaryUrls.push(cloudUrl);
          console.log('☁️ Image uploaded to Cloudinary:', cloudUrl);
        } catch (cloudErr) {
          console.warn('⚠️ Cloudinary upload failed:', cloudErr);
        }
      }

      if (cloudinaryUrls.length > 0) {
        console.log('✅ All images successfully uploaded to Cloudinary:', cloudinaryUrls);
      } else {
        console.warn('⚠️ No images were uploaded to Cloudinary');
      }

      setSuccess(`Report validated successfully! Issue detected: ${result.detected ? result.issue_type : 'None'}`);
      
      // Clear form
      setImages([]);
      setImageFiles([]);
      
      setTimeout(() => {
        router.push('/citizen/dashboard');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to submit report');
      console.error('Submit error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout navigation={navigation} title="Citizen Portal">
      <div className="min-h-screen from-blue-50 to-indigo-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-block p-4 bg-white rounded-full shadow-lg mb-4">
              <span className="text-5xl">📸</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Report an Issue</h1>
            <p className="text-gray-600 text-lg">Share photos of problems in your city</p>
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Alert Messages */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4">
                <Alert variant="danger">{error}</Alert>
              </div>
            )}
            {success && (
              <div className="bg-green-50 border-l-4 border-green-500 p-4">
                <Alert variant="success">{success}</Alert>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-8">
              {/* Image Upload Area */}
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-900 mb-4">
                  Upload Photos <span className="text-red-500">*</span>
                </label>
                
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                    dragActive
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-300 bg-gray-50 hover:border-indigo-400'
                  }`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer block"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-6xl mb-3">📷</span>
                      <p className="text-lg font-semibold text-gray-900 mb-1">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-sm text-gray-600">
                        JPG, PNG, WebP up to 20MB each
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Maximum 10 images
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Image Previews */}
              {images.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">
                      Photos ({images.length}/10)
                    </h3>
                    {images.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setImages([]);
                          setImageFiles([]);
                        }}
                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {images.map((img, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={img.preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg shadow-md group-hover:shadow-lg transition-shadow"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm hover:bg-red-600 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ✕
                        </button>
                        <span className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                          {index + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1 py-3 font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || imageFiles.length === 0}
                  className="flex-1 py-3 font-semibold bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <span className="mr-2">✓</span>
                      Submit Report
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* Tips Section */}
          <div className="mt-8 bg-white rounded-xl shadow-lg p-6 border-l-4 border-indigo-500">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center text-lg">
              <span className="mr-2">💡</span> Tips for Better Reports
            </h3>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="text-indigo-500 font-bold mr-3">•</span>
                <span>Take clear, well-lit photos showing the full issue</span>
              </li>
              <li className="flex items-start">
                <span className="text-indigo-500 font-bold mr-3">•</span>
                <span>Include multiple angles for better context</span>
              </li>
              <li className="flex items-start">
                <span className="text-indigo-500 font-bold mr-3">•</span>
                <span>Capture nearby landmarks or street signs when possible</span>
              </li>
              <li className="flex items-start">
                <span className="text-indigo-500 font-bold mr-3">•</span>
                <span>High-resolution photos help faster resolution</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
