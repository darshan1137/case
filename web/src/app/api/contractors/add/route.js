import { NextResponse } from 'next/server';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { sendContractorOnboardingEmail } from '@/lib/emailService';

/**
 * POST /api/contractors/add
 * Create a new contractor account
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
      created_by_uid,
      created_by_role,
      created_by_class,
      zone,
      wards,
      active = true
    } = body;


    // Verify the creating officer exists and is class_a
    const officerRef = doc(db, 'users', created_by_uid);
    const officerSnap = await getDoc(officerRef);
    
    if (!officerSnap.exists()) {
      return NextResponse.json(
        { error: 'Creating officer not found', code: 'OFFICER_NOT_FOUND' },
        { status: 404 }
      );
    }

    const officer = officerSnap.data();
    if (officer.role !== 'officer' || officer.class !== 'class_a') {
      return NextResponse.json(
        { 
          error: 'Unauthorized: Only Class-A officers can add contractors',
          code: 'UNAUTHORIZED_ROLE' 
        },
        { status: 403 }
      );
    }

    // ============================================
    // VALIDATION
    // ============================================
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
    // CREATE CONTRACTOR
    // ============================================
    
    // Generate temporary password (auto-generated secure password)
    const tempPassword = generateSecurePassword();

    // Create Firebase Auth user
    let userCredential;
    try {
      userCredential = await createUserWithEmailAndPassword(auth, email.toLowerCase(), tempPassword);
    } catch (authError) {
      console.error('[Add Contractor API] Firebase Auth error:', authError);
      
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

    // Create contractor profile in Firestore
    const contractorData = {
      uid: uid,
      role: 'contractor',  // Hard-set, not user-selectable
      name: name.trim(),
      email: email.toLowerCase(),
      phone: phoneClean,
      active: active,
      created_at: Timestamp.now(),
      created_by: created_by_uid,
      // Optional fields
      ...(zone && { zone }),
      ...(wards && wards.length > 0 && { wards }),
    };

    await setDoc(doc(db, 'users', uid), contractorData);

    console.log(`[Add Contractor API] Contractor created: ${uid} by officer ${created_by_uid}`);

    // ============================================
    // SEND ONBOARDING EMAIL (Non-blocking)
    // ============================================
    try {
      sendContractorOnboardingEmail(
        contractorData,
        tempPassword,
        officer.name || 'CASE Administrator'
      ).catch(err => console.error('[Add Contractor API] Email failed:', err));
    } catch (emailError) {
      console.error('[Add Contractor API] Email error:', emailError);
      // Don't fail the API if email fails
    }

    // Return success (without password for security)
    return NextResponse.json({
      success: true,
      message: 'Contractor created successfully',
      contractor: {
        uid: uid,
        name: contractorData.name,
        email: contractorData.email,
        phone: contractorData.phone,
        role: contractorData.role,
        active: contractorData.active,
        created_at: new Date()
      },
      email_sent: true
    }, { status: 201 });

  } catch (error) {
    console.error('[Add Contractor API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message, code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * Generate a secure random password
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
