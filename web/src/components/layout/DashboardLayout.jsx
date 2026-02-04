'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { Bell, LogOut, User, Home, FileText, Briefcase, Settings, Menu, X, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import GoogleTranslate from '@/components/GoogleTranslate';
import ThemeToggle from '@/components/ThemeToggle';

export function DashboardLayout({ children, navigation, title }) {
  const pathname = usePathname();
  const router = useRouter();
  const { userData, loading } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleLogout = async () => {
    setShowLogoutDialog(false);
    await authService.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-purple-100">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg animate-pulse">
            <span className="text-white text-2xl font-bold">C</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <p className="text-slate-600 text-sm font-medium mt-3">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const iconMap = {
    'Dashboard': Home,
    'Reports': FileText,
    'Work Orders': Briefcase,
    'Jobs': Briefcase,
    'Profile': User,
    'Settings': Settings,
  };

  return (
    <>
      {/* Logout Confirmation Dialog */}
      <AnimatePresence>
        {showLogoutDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowLogoutDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 border border-slate-200"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Confirm Logout</h3>
                  <p className="text-sm text-slate-600">Are you sure you want to sign out?</p>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowLogoutDialog(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium rounded-lg transition-all shadow-md"
                >
                  Logout
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100">
        {/* Top Navigation Bar */}
        <nav className="bg-white/95 backdrop-blur-xl shadow-sm border-b border-purple-200/50 sticky top-0 z-40">
          <div className="max-w-full px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center gap-4">
                {/* Mobile menu button */}
                <button
                  onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                  className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                  {mobileSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>

                <Link href="/" className="flex items-center gap-3">
                  <Image
                    src="/logo.svg"
                    alt="CASE Logo"
                    width={40}
                    height={40}
                    className="w-10 h-10"
                  />
                  <div className="hidden sm:block">
                    <span className="font-bold text-slate-900 text-lg">CASE</span>
                    <span className="text-xs text-slate-500 block -mt-0.5">Platform</span>
                  </div>
                </Link>
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg shadow-sm">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <span className="text-xs font-semibold">{title}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Theme Toggle */}
                <ThemeToggle />
                
                {/* Google Translate */}
                <GoogleTranslate />
                
                {/* Notifications */}
                <button className="relative p-2.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/80 rounded-xl transition-all">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white"></span>
                </button>
                
                {/* User Menu */}
                <div className="flex items-center gap-3 border-l border-slate-200 pl-3 ml-1">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-semibold text-slate-900">{userData?.name}</p>
                    <p className="text-xs text-slate-500 capitalize">{userData?.role?.replace('_', ' ')}</p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center shadow-md ring-2 ring-indigo-100">
                    <span className="text-white font-bold text-sm">
                      {userData?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowLogoutDialog(true)}
                    className="p-2.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </nav>

        <div className="flex max-w-full">
          {/* Sidebar - Desktop */}
          <aside className="hidden lg:block w-64 bg-white/80 backdrop-blur-sm min-h-[calc(100vh-4rem)] border-r border-slate-200/60 shadow-sm">
            <nav className="p-3 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                const IconComponent = iconMap[item.name];
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium group relative overflow-hidden',
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-200/50'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-indigo-700'
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-blue-600"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <div className="relative z-10 flex items-center gap-3 flex-1">
                      {IconComponent && (
                        <IconComponent className={cn('w-5 h-5', isActive ? 'text-white' : 'text-slate-500 group-hover:text-indigo-600')} />
                      )}
                      <span>{item.name}</span>
                    </div>
                    {isActive && (
                      <div className="relative z-10 w-1.5 h-1.5 bg-white rounded-full shadow-sm" />
                    )}
                  </Link>
                );
              })}
            </nav>
            
            {/* Footer Badge */}
            <div className="absolute bottom-4 left-3 right-3">
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 text-slate-700 text-xs mb-1">
                  <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                  <span className="font-semibold">Made in India</span>
                </div>
                <p className="text-xs text-slate-500 ml-4">by Coding Gurus</p>
              </div>
            </div>
          </aside>

          {/* Mobile Sidebar */}
          <AnimatePresence>
            {mobileSidebarOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                  onClick={() => setMobileSidebarOpen(false)}
                />
                <motion.aside
                  initial={{ x: -320 }}
                  animate={{ x: 0 }}
                  exit={{ x: -320 }}
                  transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                  className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-64 bg-white shadow-2xl"
                >
                  <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                    <span className="font-bold text-slate-900">Menu</span>
                    <button onClick={() => setMobileSidebarOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <nav className="p-3 space-y-1">
                    {navigation.map((item) => {
                      const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                      const IconComponent = iconMap[item.name];
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setMobileSidebarOpen(false)}
                          className={cn(
                            'flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium',
                            isActive
                              ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg'
                              : 'text-slate-700 hover:bg-slate-50'
                          )}
                        >
                          {IconComponent && <IconComponent className="w-5 h-5" />}
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}
                  </nav>
                </motion.aside>
              </>
            )}
          </AnimatePresence>

          {/* Main Content */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-4rem)] bg-gradient-to-br from-transparent via-purple-50/30 to-white">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
