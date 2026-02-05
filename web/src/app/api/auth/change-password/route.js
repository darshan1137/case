import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

/**
 * PATCH /api/auth/change-password
 * Change user password using Firebase Authentication
 * Accessible to: Contractors, Class B Officers, Class C Officers
 */
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { userId, currentPassword, newPassword, email } = body;

    // Validate required fields
    if (!userId || !currentPassword || !newPassword || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, email, currentPassword, newPassword' },
        { status: 400 }
      );
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return NextResponse.json(
        { 
          error: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character' 
        },
        { status: 400 }
      );
    }

    // Check if new password is same as current
    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: 'New password must be different from current password' },
        { status: 400 }
      );
    }

    const db = admin.firestore();

    // Get user document to verify role and permissions
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();

    // Check if user has allowed role
    const allowedRoles = ['contractor', 'officer'];
    if (!allowedRoles.includes(userData.role)) {
      return NextResponse.json(
        { error: 'Unauthorized: Only contractors and officers can change passwords via this endpoint' },
        { status: 403 }
      );
    }

    // For officers, check class
    if (userData.role === 'officer') {
      const allowedClasses = ['class_b', 'class_c'];
      if (!allowedClasses.includes(userData.class)) {
        return NextResponse.json(
          { error: 'Unauthorized: Only Class B and Class C officers can use this feature' },
          { status: 403 }
        );
      }
    }

    // Verify current password using Firebase REST API
    const verifyPasswordUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`;
    
    const verifyResponse = await fetch(verifyPasswordUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: currentPassword,
        returnSecureToken: true,
      }),
    });

    if (!verifyResponse.ok) {
      const errorData = await verifyResponse.json();
      
      if (errorData.error?.message === 'INVALID_PASSWORD' || errorData.error?.message === 'INVALID_LOGIN_CREDENTIALS') {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to verify current password' },
        { status: 500 }
      );
    }

    // Update password using Firebase Admin SDK
    try {
      await admin.auth().updateUser(userId, {
        password: newPassword,
      });
    } catch (authError) {
      console.error('Firebase Auth error:', authError);
      return NextResponse.json(
        { error: 'Failed to update password in Firebase Authentication' },
        { status: 500 }
      );
    }

    // Update timestamp in Firestore
    await userRef.update({
      password_updated_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    // Send security notification email (optional but recommended)
    try {
      const emailService = require('@/lib/emailService');
      if (emailService && emailService.sendPasswordChangeNotification) {
        await emailService.sendPasswordChangeNotification({
          email: userData.email,
          name: userData.name,
          timestamp: new Date().toLocaleString('en-IN', {
            dateStyle: 'full',
            timeStyle: 'short'
          })
        });
      }
    } catch (emailError) {
      // Don't fail the request if email fails
      console.error('Failed to send password change notification email:', emailError);
    }

    // Return success
    return NextResponse.json({
      success: true,
      message: 'Password changed successfully',
      updated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error changing password:', error);
    
    // Don't expose internal errors
    return NextResponse.json(
      { error: 'An error occurred while changing password. Please try again.' },
      { status: 500 }
    );
  }
}
