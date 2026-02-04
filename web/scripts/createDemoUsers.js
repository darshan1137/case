// Script to create demo users for all roles
// Run this script with: node scripts/createDemoUsers.js

const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

// Check if environment variables are set
const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('❌ Error: Missing required environment variables!');
  console.log('\n📋 Missing variables:');
  missingVars.forEach(v => console.log(`   - ${v}`));
  console.log('\n💡 Add these to your .env.local file:\n');
  console.log('NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id');
  console.log('FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com');
  console.log('FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"');
  console.log('');
  process.exit(1);
}

// Initialize Firebase Admin using environment variables
try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  });
  console.log('✅ Firebase Admin initialized successfully\n');
} catch (error) {
  console.error('❌ Error initializing Firebase Admin:');
  console.error(error.message);
  process.exit(1);
}

const auth = admin.auth();
const db = admin.firestore();

const demoUsers = [
  {
    email: 'citizen@demo.com',
    password: 'demo123',
    name: 'Demo Citizen',
    role: 'citizen',
    phone: '+911234567890',
    department: null,
    ward_id: null,
    zone: null
  },
  {
    email: 'contractor@demo.com',
    password: 'demo123',
    name: 'Demo Contractor',
    role: 'contractor',
    phone: '+911234567891',
    department: null,
    ward_id: null,
    zone: null
  },
  {
    email: 'officer.c@demo.com',
    password: 'demo123',
    name: 'Demo Class C Officer',
    role: 'class_c',
    phone: '+911234567892',
    department: 'PWD',
    ward_id: 'ward_01',
    zone: 'Zone A'
  },
  {
    email: 'officer.b@demo.com',
    password: 'demo123',
    name: 'Demo Class B Officer',
    role: 'class_b',
    phone: '+911234567893',
    department: 'PWD',
    ward_id: 'ward_01',
    zone: 'Zone A'
  },
  {
    email: 'admin@demo.com',
    password: 'demo123',
    name: 'Demo Admin',
    role: 'class_a',
    phone: '+911234567894',
    department: 'Administration',
    ward_id: null,
    zone: 'All Zones'
  }
];

async function createDemoUsers() {
  console.log('🚀 Starting demo user creation...\n');

  for (const userData of demoUsers) {
    try {
      console.log(`Creating user: ${userData.email}`);
      
      // Check if user already exists
      let userRecord;
      try {
        userRecord = await auth.getUserByEmail(userData.email);
        console.log(`   ✓ User already exists in Auth: ${userRecord.uid}`);
      } catch (error) {
        if (error.code === 'auth/user-not-found') {
          // Create new auth user
          userRecord = await auth.createUser({
            email: userData.email,
            password: userData.password,
            displayName: userData.name,
            emailVerified: true
          });
          console.log(`   ✓ Created in Auth: ${userRecord.uid}`);
        } else {
          throw error;
        }
      }

      // Create/Update user document in Firestore
      const userDoc = {
        name: userData.name,
        role: userData.role,
        department: userData.department,
        ward_id: userData.ward_id,
        zone: userData.zone,
        phone: userData.phone,
        email: userData.email,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        active: true,
        uid: userRecord.uid
      };

      await db.collection('users').doc(userRecord.uid).set(userDoc, { merge: true });
      console.log(`   ✓ Created/Updated in Firestore`);
      console.log(`   Role: ${userData.role}\n`);

    } catch (error) {
      console.error(`   ✗ Error creating ${userData.email}:`, error.message);
      console.log('');
    }
  }

  console.log('✅ Demo user creation complete!\n');
  console.log('Demo Accounts:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  demoUsers.forEach(user => {
    console.log(`${user.name.padEnd(25)} | ${user.email.padEnd(25)} | ${user.password}`);
  });
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  process.exit(0);
}

createDemoUsers().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
