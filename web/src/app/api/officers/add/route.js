import { NextResponse } from 'next/server';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { sendOfficerOnboardingEmail } from '@/lib/emailService';

/**
 * POST /api/officers/add
 * Create a new officer account (Class-B or Class-C)
 * 
 * CRITICAL: Only Class-A officers can access this endpoint
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      name, 
      email, 
      phone, 
      department,
      zone,
      ward_id,
      class: officerClass,
      created_by_uid,
      created_by_role,
      created_by_class,
      active = true
    } = body;

    // ============================================
    // AUTHORIZATION CHECK
    // ============================================
    
    // Verify the creating officer exists and is class_a
    const officerRef = doc(db, 'users', created_by_uid);
    const officerSnap = await getDoc(officerRef);
    
    if (!officerSnap.exists()) {
      return NextResponse.json(
        { error: 'Creating officer not found', code: 'OFFICER_NOT_FOUND' },
        { status: 404 }
      );
    }

    const creatingOfficer = officerSnap.data();
    if (creatingOfficer.role !== 'officer' || creatingOfficer.class !== 'class_a') {
      return NextResponse.json(
        { 
          error: 'Unauthorized: Only Class-A officers can add officers',
          code: 'UNAUTHORIZED_ROLE' 
        },
        { status: 403 }
      );
    }

    // ============================================
    // VALIDATION
    // ============================================
    
    // Name validation
    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Name must be at least 2 characters', code: 'INVALID_NAME' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address', code: 'INVALID_EMAIL' },
        { status: 400 }
      );
    }

    // Phone validation (India format: 10 digits)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phone || !phoneRegex.test(phone.replace(/\D/g, ''))) {
      return NextResponse.json(
        { error: 'Invalid phone number. Must be 10 digits starting with 6-9', code: 'INVALID_PHONE' },
        { status: 400 }
      );
    }

    // Department validation
    if (!department || department.trim().length === 0) {
      return NextResponse.json(
        { error: 'Department is required', code: 'INVALID_DEPARTMENT' },
        { status: 400 }
      );
    }

    // Zone validation
    if (!zone || zone.trim().length === 0) {
      return NextResponse.json(
        { error: 'Zone is required', code: 'INVALID_ZONE' },
        { status: 400 }
      );
    }

    // Ward validation
    if (!ward_id || ward_id.trim().length === 0) {
      return NextResponse.json(
        { error: 'Ward is required', code: 'INVALID_WARD' },
        { status: 400 }
      );
    }

    // Officer class validation - CRITICAL: Only allow class_b and class_c
    if (!officerClass || !['class_b', 'class_c'].includes(officerClass)) {
      return NextResponse.json(
        { 
          error: 'Invalid officer class. Only class_b and class_c are allowed',
          code: 'INVALID_CLASS' 
        },
        { status: 400 }
      );
    }

    // Check if email already exists
    const usersRef = collection(db, 'users');
    const emailQuery = query(usersRef, where('email', '==', email.toLowerCase()));
    const emailDocs = await getDocs(emailQuery);
    
    if (!emailDocs.empty) {
      return NextResponse.json(
        { 
          error: 'A user with this email already exists', 
          code: 'EMAIL_EXISTS' 
        },
        { status: 409 }
      );
    }

    // Check if phone already exists
    const phoneClean = phone.replace(/\D/g, '');
    const phoneQuery = query(usersRef, where('phone', '==', phoneClean));
    const phoneDocs = await getDocs(phoneQuery);
    
    if (!phoneDocs.empty) {
      return NextResponse.json(
        { 
          error: 'A user with this phone number already exists', 
          code: 'PHONE_EXISTS' 
        },
        { status: 409 }
      );
    }

    // ============================================
    // CREATE OFFICER
    // ============================================
    
    // Generate temporary password (auto-generated secure password)
    const tempPassword = generateSecurePassword();

    // Create Firebase Auth user
    let userCredential;
    try {
      userCredential = await createUserWithEmailAndPassword(auth, email.toLowerCase(), tempPassword);
    } catch (authError) {
      console.error('[Add Officer API] Firebase Auth error:', authError);
      
      if (authError.code === 'auth/email-already-in-use') {
        return NextResponse.json(
          { error: 'Email already in use', code: 'EMAIL_EXISTS' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to create authentication account', code: 'AUTH_ERROR' },
        { status: 500 }
      );
    }

    const uid = userCredential.user.uid;

    // Create officer profile in Firestore
    // CRITICAL: role is hardcoded to "officer", never user-selectable
    const officerData = {
      uid: uid,
      role: 'officer',  // Hard-set, not user-selectable
      class: officerClass, // class_b or class_c only
      name: name.trim(),
      email: email.toLowerCase(),
      phone: phoneClean,
      department: department,
      zone: zone,
      ward_id: ward_id,
      active: active,
      created_at: Timestamp.now(),
      created_by: created_by_uid,
    };

    await setDoc(doc(db, 'users', uid), officerData);

    console.log(`[Add Officer API] Officer created: ${uid} (${officerClass}) by Class-A officer ${created_by_uid}`);

    // ============================================
    // SEND ONBOARDING EMAIL (Non-blocking)
    // ============================================
    try {
      sendOfficerOnboardingEmail(
        officerData,
        tempPassword,
        creatingOfficer.name || 'CASE Administrator'
      ).catch(err => console.error('[Add Officer API] Email failed:', err));
    } catch (emailError) {
      console.error('[Add Officer API] Email error:', emailError);
      // Don't fail the API if email fails
    }

    // Return success (without password for security)
    return NextResponse.json({
      success: true,
      message: 'Officer created successfully',
      officer: {
        uid: uid,
        name: officerData.name,
        email: officerData.email,
        phone: officerData.phone,
        role: officerData.role,
        class: officerData.class,
        department: officerData.department,
        zone: officerData.zone,
        ward_id: officerData.ward_id,
        active: officerData.active,
        created_at: new Date()
      },
      email_sent: true
    }, { status: 201 });

  } catch (error) {
    console.error('[Add Officer API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message, code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * Generate a secure random password
 * Ensures at least one uppercase, lowercase, number, and special character
 */
function generateSecurePassword() {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  // Ensure at least one of each type
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Uppercase
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Lowercase
  password += '0123456789'[Math.floor(Math.random() * 10)]; // Number
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // Special char
  
  // Fill remaining characters
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}
