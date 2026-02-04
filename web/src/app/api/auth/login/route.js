import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: 'Email and password are required'
      }, { status: 400 });
    }

    // Sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    // Get user data from Firestore
    const userDocRef = doc(db, 'users', uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      return NextResponse.json({
        success: false,
        error: 'User profile not found. Please contact support.'
      }, { status: 404 });
    }

    const userData = userDocSnap.data();

    // Check if user account exists and is active
    if (userData.active === false) {
      return NextResponse.json({
        success: false,
        error: 'Your account has been deactivated. Please contact support.'
      }, { status: 403 });
    }

    // Get access token
    const token = await userCredential.user.getIdToken();

    // Return successful login response
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: uid,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        class: userData.class,
        department: userData.department || null,
        ward_id: userData.ward_id || null,
        zone: userData.zone || null,
        phone: userData.phone || null,
        active: userData.active !== false,
      },
      token: token
    }, { status: 200 });
  } catch (error) {
    console.error('Login error:', error);

    // Handle specific Firebase errors
    if (error.code === 'auth/user-not-found') {
      return NextResponse.json({
        success: false,
        error: 'No account found with this email. Please check and try again.'
      }, { status: 401 });
    }

    if (error.code === 'auth/wrong-password') {
      return NextResponse.json({
        success: false,
        error: 'Incorrect password. Please try again.'
      }, { status: 401 });
    }

    if (error.code === 'auth/invalid-email') {
      return NextResponse.json({
        success: false,
        error: 'Invalid email format. Please check your email address.'
      }, { status: 400 });
    }

    if (error.code === 'auth/invalid-credential') {
      return NextResponse.json({
        success: false,
        error: 'Invalid email or password. Please check your credentials.'
      }, { status: 401 });
    }

    if (error.code === 'auth/too-many-requests') {
      return NextResponse.json({
        success: false,
        error: 'Too many failed login attempts. Please try again later.'
      }, { status: 429 });
    }

    if (error.code === 'auth/network-request-failed') {
      return NextResponse.json({
        success: false,
        error: 'Network error. Please check your connection and try again.'
      }, { status: 503 });
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Login failed. Please try again.'
    }, { status: 500 });
  }
}
