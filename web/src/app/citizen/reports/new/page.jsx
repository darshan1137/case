'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Textarea, Select, Alert } from '@/components/ui';
import { reportService } from '@/lib/reportService';
import { CATEGORIES_LIST, PRIORITY_LEVELS } from '@/lib/constants/sla';
import { WARDS_LIST, getZoneForWard } from '@/lib/constants/wards';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

const navigation = [
  { name: 'Dashboard', href: '/citizen/dashboard', icon: '📊' },
  { name: 'New Report', href: '/citizen/reports/new', icon: '📝' },
  { name: 'My Reports', href: '/citizen/reports', icon: '📋' },
  { name: 'Track Status', href: '/citizen/track', icon: '🔍' },
  { name: 'Profile', href: '/citizen/profile', icon: '👤' },
];

export default function NewReportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userData, loading: authLoading } = useAuth();
  
  const [formData, setFormData] = useState({
    category: '',
    subcategory: '',
    description: '',
    priority: 'medium',
    ward_id: '',
    address: '',
    latitude: '',
    longitude: ''
  });
  const [images, setImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && userData?.role !== 'citizen') {
      router.push('/auth/login');
      return;
    }

    // Get category from URL if provided
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setFormData(prev => ({ ...prev, category: categoryParam }));
    }
  }, [userData, authLoading, searchParams]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'category') {
      setFormData(prev => ({ ...prev, subcategory: '' }));
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 5) {
      setError('Maximum 5 images allowed');
      return;
    }

    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));

    setImages(prev => [...prev, ...newImages]);
    setImageFiles(prev => [...prev, ...files]);
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setFormData(prev => ({
          ...prev,
          latitude: latitude.toString(),
          longitude: longitude.toString()
        }));

        // Try to get address from coordinates (reverse geocoding)
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          if (data.display_name) {
            setFormData(prev => ({
              ...prev,
              address: data.display_name
            }));
          }
        } catch (err) {
          console.error('Error getting address:', err);
        }

        setLocationLoading(false);
      },
      (err) => {
        setError('Unable to retrieve your location');
        setLocationLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const uploadImages = async (reportId) => {
    const uploadedUrls = [];
    
    for (const file of imageFiles) {
      const fileRef = ref(storage, `reports/${reportId}/${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      uploadedUrls.push(url);
    }

    return uploadedUrls;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validation
      if (!formData.category) {
        throw new Error('Please select a category');
      }
      if (!formData.description || formData.description.length < 20) {
        throw new Error('Description must be at least 20 characters');
      }
      if (!formData.ward_id) {
        throw new Error('Please select a ward');
      }
      if (imageFiles.length === 0) {
        throw new Error('Please upload at least one image');
      }

      // Get category details
      const categoryData = CATEGORIES_LIST.find(c => c.id === formData.category);

      // Create report first to get ID
      const reportData = {
        reporter_id: userData.uid,
        reporter_name: userData.name,
        reporter_phone: userData.phone,
        category: formData.category,
        subcategory: formData.subcategory,
        department: categoryData?.department || 'general_admin',
        description: formData.description,
        priority: formData.priority,
        ward_id: formData.ward_id,
        zone_id: getZoneForWard(formData.ward_id),
        location: {
          coordinates: {
            lat: parseFloat(formData.latitude) || 0,
            lng: parseFloat(formData.longitude) || 0
          },
          address: formData.address,
          ward_id: formData.ward_id
        },
        images: []
      };

      // Create report
      const result = await reportService.createReport(reportData, userData.uid);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create report');
      }

      // Upload images
      const imageUrls = await uploadImages(result.report_id);
      
      // Update report with image URLs
      await reportService.updateReport(result.report_id, { images: imageUrls });

      setSuccess(`Report submitted successfully! ID: ${result.report_id}`);
      
      // Redirect to report details after 2 seconds
      setTimeout(() => {
        router.push(`/citizen/reports/${result.report_id}`);
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedCategory = CATEGORIES_LIST.find(c => c.id === formData.category);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <DashboardLayout navigation={navigation} title="Citizen Portal">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Report New Issue</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}

              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  {CATEGORIES_LIST.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => handleSelectChange('category', category.id)}
                      className={`p-3 border rounded-lg text-center transition-colors ${
                        formData.category === category.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-2xl">{category.icon}</span>
                      <p className="text-xs text-gray-700 mt-1">{category.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Subcategory */}
              {selectedCategory?.subcategories && (
                <Select
                  label="Subcategory"
                  value={formData.subcategory}
                  onChange={(e) => handleSelectChange('subcategory', e.target.value)}
                  options={[
                    { value: '', label: 'Select subcategory' },
                    ...selectedCategory.subcategories.map(sub => ({
                      value: sub.id,
                      label: sub.name
                    }))
                  ]}
                />
              )}

              {/* Description */}
              <Textarea
                label="Description *"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe the issue in detail (minimum 20 characters)"
                rows={4}
                required
              />

              {/* Priority */}
              <Select
                label="Priority"
                value={formData.priority}
                onChange={(e) => handleSelectChange('priority', e.target.value)}
                options={Object.entries(PRIORITY_LEVELS).map(([key, level]) => ({
                  value: key,
                  label: `${level.name} - ${level.description}`
                }))}
              />

              {/* Location Section */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-medium text-gray-900 mb-4">📍 Location Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Ward *"
                    value={formData.ward_id}
                    onChange={(e) => handleSelectChange('ward_id', e.target.value)}
                    options={[
                      { value: '', label: 'Select ward' },
                      ...WARDS_LIST.map(ward => ({
                        value: ward.id,
                        label: ward.name
                      }))
                    ]}
                    required
                  />

                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={getCurrentLocation}
                      disabled={locationLoading}
                      className="w-full"
                    >
                      {locationLoading ? (
                        <>
                          <span className="animate-spin mr-2">⏳</span>
                          Getting Location...
                        </>
                      ) : (
                        <>
                          <span className="mr-2">📍</span>
                          Get Current Location
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <Input
                    label="Latitude"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleInputChange}
                    placeholder="e.g., 18.5204"
                  />
                  <Input
                    label="Longitude"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleInputChange}
                    placeholder="e.g., 73.8567"
                  />
                </div>

                <Input
                  label="Address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Full address or landmark"
                  className="mt-4"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Images * (Max 5)
                </label>
                
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
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
                    className="cursor-pointer text-blue-600 hover:text-blue-700"
                  >
                    <span className="text-4xl">📷</span>
                    <p className="mt-2">Click to upload images</p>
                    <p className="text-sm text-gray-500">PNG, JPG up to 10MB each</p>
                  </label>
                </div>

                {/* Image Previews */}
                {images.length > 0 && (
                  <div className="grid grid-cols-5 gap-3 mt-4">
                    {images.map((img, index) => (
                      <div key={index} className="relative">
                        <img
                          src={img.preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-20 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs hover:bg-red-600"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <span className="mr-2">📤</span>
                      Submit Report
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card className="mt-4 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-blue-900 mb-2">💡 Tips for a Good Report</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Take clear photos showing the full extent of the issue</li>
              <li>• Enable location services for accurate positioning</li>
              <li>• Provide as much detail as possible in the description</li>
              <li>• Select the correct category for faster resolution</li>
              <li>• Include nearby landmarks in the address</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
