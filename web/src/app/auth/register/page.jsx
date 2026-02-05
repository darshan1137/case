"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Eye,
  EyeOff,
  AlertCircle,
  X,
  Mail,
  Lock,
  User,
  Phone,
  Loader2,
} from "lucide-react";
import { userService } from "@/lib/userService";
import { Button } from "@/components/ui";

export default function CitizenRegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("Name is required");
      return false;
    }
    if (!formData.email.trim()) {
      setError("Email is required");
      return false;
    }
    if (!formData.phone.trim()) {
      setError("Phone number is required");
      return false;
    }
    if (formData.phone.length < 10) {
      setError("Please enter a valid phone number");
      return false;
    }
    const phoneRegex = /^\+91[0-9]{10}$/;
    if (!phoneRegex.test(formData.phone)) {
      setError("Phone must be in format +91XXXXXXXXXX");
      return false;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    setLoading(true);

    try {
      const result = await userService.createUser({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        phone: formData.phone,
        role: "citizen",
        department: null,
        ward_id: null,
        zone: null,
      });

      if (!result.success) {
        setError(result.error);
        setLoading(false);
        return;
      }

      router.push("/citizen/dashboard");
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error(err);
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <>
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          10%,
          30%,
          50%,
          70%,
          90% {
            transform: translateX(-5px);
          }
          20%,
          40%,
          60%,
          80% {
            transform: translateX(5px);
          }
        }
        .fade-in {
          opacity: 0;
          transform: translateY(20px);
          transition:
            opacity 0.6s ease-out,
            transform 0.6s ease-out;
        }
        .fade-in-active {
          opacity: 1;
          transform: translateY(0);
        }
        .shake {
          animation: shake 0.5s ease-in-out;
        }
        .gov-stripe {
          background: linear-gradient(
            90deg,
            #ff9933 33.33%,
            #ffffff 33.33%,
            #ffffff 66.66%,
            #138808 66.66%
          );
          height: 4px;
        }
      `}</style>

      <div
        className="min-h-screen flex items-center justify-center bg-cover bg-center relative"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1920')",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/90 via-indigo-50/80 to-blue-50/75 backdrop-blur-sm"></div>
        <div className="absolute top-0 left-0 right-0 gov-stripe"></div>

        <div className="relative z-10 w-full max-w-4xl bg-white rounded-2xl shadow-2xl border-2 border-indigo-100 overflow-hidden flex flex-col md:flex-row my-8">
          <div
            className="md:w-7/12 w-full p-8 bg-white fade-in fade-in-active overflow-y-auto"
            style={{ maxHeight: "90vh" }}
          >
            <div className="flex items-center gap-2 mb-6">
              <div className="h-1 w-10 bg-indigo-600"></div>
              <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wide">
                Citizen Registration
              </h2>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-md shake flex items-start">
                <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
                <button
                  onClick={() => setError("")}
                  className="ml-3 text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 text-xs font-semibold mb-2 uppercase tracking-wide">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="w-full border-2 border-gray-300 rounded-lg pl-11 pr-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200 transition-all"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

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
                    className="w-full border-2 border-gray-300 rounded-lg pl-11 pr-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200 transition-all"
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 text-xs font-semibold mb-2 uppercase tracking-wide">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    pattern="\+91[0-9]{10}"
                    className="w-full border-2 border-gray-300 rounded-lg pl-11 pr-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200 transition-all"
                    placeholder="+91XXXXXXXXXX"
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
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="w-full border-2 border-gray-300 rounded-lg pl-11 pr-12 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200 transition-all"
                    placeholder="Min 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 text-xs font-semibold mb-2 uppercase tracking-wide">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="w-full border-2 border-gray-300 rounded-lg pl-11 pr-12 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200 transition-all"
                    placeholder="Re-enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold py-3 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg uppercase tracking-wide text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mt-6"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </button>

              <div className="text-center pt-4 text-sm text-gray-600">
                Already have an account?{" "}
                <Link
                  href="/auth/login"
                  className="text-indigo-600 hover:text-indigo-700 font-semibold"
                >
                  Sign in
                </Link>
              </div>
            </form>
          </div>

          <div className="md:w-5/12 w-full bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-700 flex flex-col items-center justify-center text-center p-8 relative fade-in fade-in-active">
            <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9IndoaXRlIi8+PC9zdmc+')] bg-repeat"></div>
            <div className="mb-6 relative z-10">
              <Image
                src="/logo.svg"
                alt="CASE Logo"
                width={120}
                height={120}
                className="drop-shadow-2xl"
              />
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tight mb-3 relative z-10">
              Join CASE
            </h1>
            <div className="h-1 w-20 bg-gradient-to-r from-orange-400 via-white to-green-400 mb-4"></div>
            <p className="text-indigo-100 text-sm leading-relaxed max-w-xs relative z-10 mb-6">
              Register now and become part of a community dedicated to improving
              civic infrastructure
            </p>
            <div className="space-y-3 relative z-10">
              <div className="flex items-center gap-3 text-white text-left">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                    />
                  </svg>
                </div>
                <p className="text-sm">Report civic issues instantly</p>
              </div>
              <div className="flex items-center gap-3 text-white text-left">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </div>
                <p className="text-sm">Track progress in real-time</p>
              </div>
              <div className="flex items-center gap-3 text-white text-left">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <p className="text-sm">Contribute to community</p>
              </div>
            </div>
            <div className="mt-8 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 relative z-10">
              <p className="text-xs font-bold text-white uppercase tracking-widest">
                Municipal Services
              </p>
            </div>
          </div>
        </div>

        <div className="absolute bottom-4 left-0 right-0 text-center text-xs text-gray-600">
          <p>
            {" "}
            2024 CASE Platform | Designed & Developed by{" "}
            <span className="font-semibold">Coding Gurus</span>
          </p>
        </div>
      </div>
    </>
  );
}
