'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { userService } from '@/lib/userService';
import { CONTRACTOR_SERVICE_TYPES_LIST } from '@/lib/constants';
import { WARDS_LIST } from '@/lib/constants/wards';
import { Button, Input, Select, Alert, AlertDescription } from '@/components/ui';

export default function ContractorRegisterPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    serviceTypes: [],
    coveredWards: [],
    zone: '',
    gstNumber: '',
    address: '',
    fleetSize: '',
    workforceSize: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const totalSteps = 3;

  const nextStep = () => {
    setError('');
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setError('');
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1:
        if (!formData.companyName.trim()) {
          setError('Company name is required');
          return false;
        }
        if (!formData.contactPerson.trim()) {
          setError('Contact person name is required');
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
        return true;
      
      case 2:
        if (!formData.zone.trim()) {
          setError('Zone is required');
          return false;
        }
        if (formData.serviceTypes.length === 0) {
          setError('Please select at least one service type');
          return false;
        }
        if (formData.coveredWards.length === 0) {
          setError('Please select at least one ward');
          return false;
        }
        if (!formData.gstNumber.trim()) {
          setError('GST number is required');
          return false;
        }
        return true;
      
      case 3:
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters');
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          return false;
        }
        return true;
      
      default:
        return true;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleMultiSelect = (e, field) => {
    const options = e.target.options;
    const selected = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(options[i].value);
      }
    }
    setFormData(prev => ({ ...prev, [field]: selected }));
    setError('');
  };

  const validateForm = () => {
    return validateCurrentStep();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (currentStep < totalSteps) {
      nextStep();
      return;
    }

    if (!validateForm()) return;

    setLoading(true);

    try {
      const result = await userService.createUser({
        email: formData.email,
        password: formData.password,
        name: formData.companyName,
        phone: formData.phone,
        role: 'contractor',
        department: 'Contractor',
        ward_id: null,
        zone: formData.zone,
        contact_person: formData.contactPerson,
        service_types: formData.serviceTypes,
        covered_wards: formData.coveredWards,
        gst_number: formData.gstNumber,
        address: formData.address,
        fleet_size: parseInt(formData.fleetSize) || 0,
        workforce_size: parseInt(formData.workforceSize) || 0,
        verified: false,
      });

      if (!result.success) {
        setError(result.error);
        setLoading(false);
        return;
      }

      router.push('/auth/pending-verification?type=contractor');
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
        {/* Left Side - Brand & Info */}
        <motion.div 
          className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 p-12 flex-col justify-between relative overflow-hidden"
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '40px 40px'
            }}></div>
          </div>

          <div className="relative z-10">
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
                <p className="text-indigo-100 text-sm">Contractor Registration</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h2 className="text-white text-4xl font-bold mb-6 leading-tight">
                Partner With Us for
                <br />
                <span className="text-amber-300">Better Cities</span>
              </h2>
              
              <p className="text-indigo-100 text-lg mb-8 leading-relaxed">
                Register your organization as an approved municipal contractor
              </p>

              {/* Steps Progress */}
              <div className="space-y-3 mb-8">
                {[
                  { num: 1, title: 'Basic Information', desc: 'Company & contact details' },
                  { num: 2, title: 'Service Details', desc: 'Coverage area & services' },
                  { num: 3, title: 'Account Setup', desc: 'Security credentials' }
                ].map((step) => (
                  <div
                    key={step.num}
                    className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${
                      currentStep === step.num
                        ? 'bg-white/20 border border-white/30'
                        : currentStep > step.num
                        ? 'bg-white/10'
                        : 'opacity-50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      currentStep === step.num
                        ? 'bg-amber-400 text-slate-900'
                        : currentStep > step.num
                        ? 'bg-green-400 text-white'
                        : 'bg-white/20 text-white'
                    }`}>
                      {currentStep > step.num ? '✓' : step.num}
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{step.title}</p>
                      <p className="text-indigo-200 text-xs">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          <motion.div
            className="relative z-10 flex items-center gap-2 text-amber-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10" opacity="0.2"/>
              <circle cx="12" cy="12" r="3" fill="currentColor"/>
            </svg>
            <span className="font-medium">Built in Bharat</span>
          </motion.div>
        </motion.div>

        {/* Right Side - Form */}
        <div className="w-full lg:w-3/5 flex items-center justify-center p-8 overflow-y-auto" style={{ maxHeight: '90vh' }}>
          <motion.div
            className="w-full max-w-md"
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <div className="lg:hidden flex items-center justify-center mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl font-bold">C</span>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Contractor Registration</h2>
              <p className="text-slate-600">Step {currentStep} of {totalSteps}</p>
              
              {/* Progress Bar */}
              <div className="mt-4 h-2 bg-slate-200 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-indigo-600 to-purple-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="error">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                <label htmlFor="companyName" className="text-sm font-medium text-gray-700">
                  Company Name
                </label>
                <Input
                  id="companyName"
                  name="companyName"
                  type="text"
                  placeholder="Enter company name"
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="contactPerson" className="text-sm font-medium text-gray-700">
                  Contact Person
                </label>
                <Input
                  id="contactPerson"
                  name="contactPerson"
                  type="text"
                  placeholder="Primary contact name"
                  value={formData.contactPerson}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="company@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium text-gray-700">
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
              />
            </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="gstNumber" className="text-sm font-medium text-gray-700">
                  GST Number
                </label>
                <Input
                  id="gstNumber"
                  name="gstNumber"
                  type="text"
                  placeholder="GST registration number"
                  value={formData.gstNumber}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="zone" className="text-sm font-medium text-gray-700">
                  Zone
                </label>
                <Input
                  id="zone"
                  name="zone"
                  type="text"
                  placeholder="e.g., WEST, EAST, CENTRAL"
                  value={formData.zone}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Fleet Size
                </label>
                <Input
                  name="fleetSize"
                  type="number"
                  placeholder="Number of vehicles"
                  value={formData.fleetSize}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Workforce Size
                </label>
                <Input
                  name="workforceSize"
                  type="number"
                  placeholder="Number of workers"
                  value={formData.workforceSize}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="address" className="text-sm font-medium text-gray-700">
                Business Address
              </label>
              <Textarea
                id="address"
                name="address"
                placeholder="Enter complete business address"
                value={formData.address}
                onChange={handleChange}
                disabled={loading}
                className="min-h-[60px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Service Types (Hold Ctrl to select multiple)
                </label>
                <select
                  multiple
                  className="w-full h-32 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => handleMultiSelect(e, 'serviceTypes')}
                  disabled={loading}
                >
                  {CONTRACTOR_SERVICE_TYPES_LIST.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Coverage Areas (Hold Ctrl to select multiple)
                </label>
                <select
                  multiple
                  className="w-full h-32 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => handleMultiSelect(e, 'coveredWards')}
                  disabled={loading}
                >
                  {WARDS_LIST.map(ward => (
                    <option key={ward.id} value={ward.id}>
                      {ward.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Min 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <Alert variant="info">
              <AlertDescription>
                Your registration will be reviewed and verified by a Class B or Class C officer before activation.
              </AlertDescription>
            </Alert>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Registration'}
            </Button>
            
            <div className="text-sm text-center text-gray-600">
              Already registered?{' '}
              <Link href="/auth/login" className="text-blue-600 hover:underline font-medium">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
