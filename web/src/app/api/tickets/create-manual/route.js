import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { NextResponse } from 'next/server';

// Initialize Firebase Admin SDK
let db;

try {
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  if (getApps().length === 0) {
    initializeApp({
      credential: cert(serviceAccount),
    });
  }

  db = getFirestore();
} catch (error) {
  console.error('Firebase Admin initialization error:', error);
}

export async function POST(request) {
  try {
    // Verify user authentication via headers
    const userId = request.headers.get('X-User-ID');
    const userName = request.headers.get('X-User-Name');

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing user ID' },
        { status: 401 }
      );
    }

    // Parse request body
    const ticketData = await request.json();

    // Validate required fields
    if (!ticketData.title || !ticketData.description) {
      return NextResponse.json(
        { error: 'Missing required fields: title and description' },
        { status: 400 }
      );
    }

    // Prepare ticket for Firestore
    const ticket = {
      ...ticketData,
      ticket_id: `TICKET-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      reporter_id: userId,
      reporter_name: userName || 'Anonymous',
      status: ticketData.status || 'submitted',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: true,
    };

    // Save to Firestore
    const docRef = await db.collection('tickets').add(ticket);

    console.log(`Ticket created: ${ticket.ticket_id} (Doc ID: ${docRef.id})`);

    return NextResponse.json(
      {
        success: true,
        ticket_id: ticket.ticket_id,
        id: docRef.id,
        message: 'Ticket created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create ticket' },
      { status: 500 }
    );
  }
}
