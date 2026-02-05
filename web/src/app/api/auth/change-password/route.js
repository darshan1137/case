import { NextResponse } from 'next/server';

/**
 * PATCH /api/auth/change-password
 * Change user password using Firebase Authentication REST API
 * Accessible to: Contractors, Class B Officers, Class C Officers
 * 
 * Note: This endpoint validates permissions using Firestore but updates password via Firebase REST API
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

    // Import Firestore Admin dynamically (only if available, otherwise skip role check)
    let userData = null;
    try {
      const { getFirestore } = await import('firebase-admin/firestore');
      const { initializeApp, getApps, cert } = await import('firebase-admin/app');
      
      // Initialize Firebase Admin if not already initialized
      if (getApps().length === 0) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
        initializeApp({
          credential: cert(serviceAccount),
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        });
      }
      
      const db = getFirestore();
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();

      if (userDoc.exists) {
        userData = userDoc.data();

        // Check if user has allowed role
        const allowedRoles = ['contractor', 'officer'];
        if (!allowedRoles.includes(userData.role)) {
          return NextResponse.json(
            { error: 'Unauthorized: Only contractors and officers can change passwords' },
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
      }
    } catch (adminError) {
      console.log('Firebase Admin not available, skipping role validation');
    }

    // Step 1: Verify current password using Firebase REST API
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
      
      if (errorData.error?.message === 'INVALID_PASSWORD' || 
          errorData.error?.message === 'INVALID_LOGIN_CREDENTIALS' ||
          errorData.error?.message === 'INVALID_EMAIL') {
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

    const verifyData = await verifyResponse.json();
    const idToken = verifyData.idToken;

    // Step 2: Update password using Firebase REST API
    const updatePasswordUrl = `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`;
    
    const updateResponse = await fetch(updatePasswordUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idToken: idToken,
        password: newPassword,
        returnSecureToken: true,
      }),
    });

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      console.error('Firebase password update error:', errorData);
      return NextResponse.json(
        { error: 'Failed to update password. Please try again.' },
        { status: 500 }
      );
    }

    // Step 3: Update timestamp in Firestore (if admin is available)
    try {
      const { getFirestore } = await import('firebase-admin/firestore');
      const { FieldValue } = await import('firebase-admin/firestore');
      
      const db = getFirestore();
      const userRef = db.collection('users').doc(userId);
      
      await userRef.update({
        password_updated_at: FieldValue.serverTimestamp(),
        updated_at: FieldValue.serverTimestamp()
      });
    } catch (firestoreError) {
      console.log('Firestore update skipped:', firestoreError.message);
    }

    // Step 4: Send security notification email (optional)
    try {
      const emailService = await import('@/lib/emailService');
      if (emailService && emailService.sendPasswordChangeNotification) {
        await emailService.sendPasswordChangeNotification({
          email: email,
          name: userData?.name || 'User',
          timestamp: new Date().toLocaleString('en-IN', {
            dateStyle: 'full',
            timeStyle: 'short'
          })
        });
      }
    } catch (emailError) {
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
