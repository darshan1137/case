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
  const [apiResponse, setApiResponse] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    issue_type: '',
    department: '',
    sub_department: '',
    severity_level: '',
    confidence_score: 0,
    reasoning: '',
    message: ''
  });

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleValidateImages = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (imageFiles.length === 0) {
        throw new Error('Please upload at least one image of the issue');
      }

      // Upload all images to Cloudinary
      const imageUrls = [];
      for (const file of imageFiles) {
        const url = await uploadToCloudinary(file);
        imageUrls.push(url);
      }

      console.log('Cloudinary image URLs:', imageUrls);

      // Prepare data for backend with Cloudinary URLs
      const ticketData = new FormData();
      
      // Add the Cloudinary URLs
      imageUrls.forEach((url, index) => {
        ticketData.append(`image_url_${index}`, url);
      });
      
      // Also send the count of images
      ticketData.append('image_count', imageUrls.length);
      console.log('Final ticket data to send:', ticketData);
      
      // Send to backend API for validation
      const response = await fetch('http://127.0.0.1:8005/api/tickets/validate-image-only', {
        method: 'POST',
        body: ticketData,
        headers: {
          'X-User-ID': userData.uid,
          'X-User-Name': userData.name || 'Anonymous'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to validate report with server');
      }

      const result = await response.json();
      console.log('API Response:', result);
      
      // Store the image URLs and API response
      setApiResponse({
        ...result,
        imageUrls: imageUrls
      });

      // Pre-fill form with API response data
      setFormData({
        title: result.title || '',
        description: result.description || '',
        issue_type: result.issue_type || '',
        department: result.department || '',
        sub_department: result.sub_department || '',
        severity_level: result.severity_level || '',
        confidence_score: result.confidence_score || 0,
        reasoning: result.reasoning || '',
        message: result.message || ''
      });

      setSuccess('');
    } catch (err) {
      setError(err.message || 'Failed to validate report');
      console.error('Validation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!apiResponse || !apiResponse.imageUrls) {
        throw new Error('Please validate images first');
      }

      // Prepare ticket data for saving to collection
      const ticketPayload = {
        reporter_id: userData.uid,
        reporter_name: userData.name || 'Anonymous',
        reporter_phone: userData.phone || '',
        title: formData.title,
        description: formData.description,
        issue_type: formData.issue_type,
        department: formData.department,
        sub_department: formData.sub_department,
        severity_level: formData.severity_level,
        confidence_score: formData.confidence_score,
        images: apiResponse.imageUrls,
        detected: apiResponse.detected,
        reasoning: formData.reasoning,
        message: formData.message,
        status: 'submitted',
        created_at: new Date().toISOString()
      };

      // Save to tickets collection via Next.js API
      const saveResponse = await fetch('/api/tickets/create-manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': userData.uid,
          'X-User-Name': userData.name || 'Anonymous'
        },
        body: JSON.stringify(ticketPayload)
      });

      if (!saveResponse.ok) {
        throw new Error('Failed to save ticket');
      }

      const saveResult = await saveResponse.json();
      setSuccess(`Ticket created successfully! ID: ${saveResult.ticket_id || saveResult.id}`);
      
      // Clear form
      setImages([]);
      setImageFiles([]);
      setApiResponse(null);
      setFormData({
        title: '',
        description: '',
        issue_type: '',
        department: '',
        sub_department: '',
        severity_level: '',
        confidence_score: 0,
        reasoning: '',
        message: ''
      });
      
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

            <form onSubmit={apiResponse ? handleSubmit : handleValidateImages} className="p-8">
              {/* Image Upload Area */}
              {!apiResponse && (
                <>
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
                </>
              )}

              {/* API Response Form - Edit the detected data */}
              {apiResponse && (
                <div className="mb-8 space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">✅ Issue Detected</h3>
                    <p className="text-sm text-blue-800">
                      {apiResponse.reasoning}
                    </p>
                  </div>

                  {/* Editable Form Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Issue Type
                      </label>
                      <input
                        type="text"
                        name="issue_type"
                        value={formData.issue_type}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Severity Level
                      </label>
                      <select
                        name="severity_level"
                        value={formData.severity_level}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        <option value="">Select Severity</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="dangerous">Dangerous</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Department
                      </label>
                      <input
                        type="text"
                        name="department"
                        value={formData.department}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sub Department
                      </label>
                      <input
                        type="text"
                        name="sub_department"
                        value={formData.sub_department}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confidence Score
                      </label>
                      <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 flex items-center">
                        {(formData.confidence_score * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="4"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      AI Reasoning
                    </label>
                    <textarea
                      name="reasoning"
                      value={formData.reasoning}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (apiResponse) {
                      setApiResponse(null);
                      setFormData({
                        title: '',
                        description: '',
                        issue_type: '',
                        department: '',
                        sub_department: '',
                        severity_level: '',
                        confidence_score: 0,
                        reasoning: '',
                        message: ''
                      });
                    } else {
                      router.back();
                    }
                  }}
                  className="flex-1 py-3 font-semibold"
                >
                  {apiResponse ? 'Back to Upload' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  disabled={loading || (apiResponse ? false : imageFiles.length === 0)}
                  className="flex-1 py-3 font-semibold bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      {apiResponse ? 'Creating Ticket...' : 'Validating...'}
                    </>
                  ) : (
                    <>
                      <span className="mr-2">{apiResponse ? '✓' : '→'}</span>
                      {apiResponse ? 'Create Ticket' : 'Validate & Continue'}
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
