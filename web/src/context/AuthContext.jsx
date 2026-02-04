'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { userService } from '@/lib/userService';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      setError(null);
      
      if (firebaseUser) {
        setUser(firebaseUser);
        
        // Fetch user data from Firestore
        const result = await userService.getUserById(firebaseUser.uid);
        if (result.success) {
          setUserData(result.user);
        } else {
          setError(result.error);
          setUserData(null);
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Refresh user data from Firestore
  const refreshUserData = async () => {
    if (user) {
      const result = await userService.getUserById(user.uid);
      if (result.success) {
        setUserData(result.user);
      }
      return result;
    }
    return { success: false, error: 'No user logged in' };
  };

  // Check if user has a specific role
  const hasRole = (role) => {
    return userData?.role === role;
  };

  // Check if user has minimum role level
  const hasMinRole = (minRole) => {
    const roleOrder = ['citizen', 'contractor', 'class_c', 'class_b', 'class_a'];
    const userRoleIndex = roleOrder.indexOf(userData?.role);
    const minRoleIndex = roleOrder.indexOf(minRole);
    return userRoleIndex >= minRoleIndex;
  };

  // Check if user is any type of officer
  const isOfficer = () => {
    return ['class_c', 'class_b', 'class_a'].includes(userData?.role);
  };

  // Check if user can access a specific department
  const canAccessDepartment = (departmentId) => {
    if (userData?.role === 'class_a') return true; // Class A can access all
    return userData?.department === departmentId;
  };

  // Check if user can access a specific ward
  const canAccessWard = (wardId) => {
    if (userData?.role === 'class_a') return true; // Class A can access all
    if (userData?.role === 'class_b') return true; // Class B can access all in their dept
    return userData?.ward_id === wardId;
  };

  const value = {
    user,           // Firebase auth user
    userData,       // Firestore user document
    loading,
    error,
    refreshUserData,
    hasRole,
    hasMinRole,
    isOfficer,
    canAccessDepartment,
    canAccessWard,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
