import { NextResponse } from 'next/server';
import { collection, addDoc, updateDoc, doc, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { sendBulkWardOfficerEmails } from '@/lib/emailService';

export async function POST(request) {
  try {
    // Parse request body
    const ticketData = await request.json();

    // Validate required fields
    if (!ticketData.citizen_id || !ticketData.title || !ticketData.description) {
      return NextResponse.json(
        { error: 'Missing required fields: citizen_id, title, and description' },
        { status: 400 }
      );
    }

    console.log('[Create Manual Ticket] Creating ticket:', ticketData.title);

    // Create ticket in Firestore
    const ticketsRef = collection(db, 'tickets');
    const docRef = await addDoc(ticketsRef, {
      ...ticketData,
      status: 'pending',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    // Update the ticket with its Firestore document ID as ticket_id
    await updateDoc(doc(db, 'tickets', docRef.id), {
      ticket_id: docRef.id
    });

    console.log(`[Create Manual Ticket] Ticket created: ${docRef.id}`);

    // Prepare complete ticket data for email
    const completeTicketData = {
      ...ticketData,
      ticket_id: docRef.id,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    // Fetch ward officer emails based on ward
    let wardOfficerEmails = [];

    if (ticketData.ward) {
      try {
        const usersRef = collection(db, 'users');
        
        // Try to find Class B officers (ward-specific) first
        const wardOfficersQuery = query(
          usersRef,
          where('role', '==', 'officer'),
          where('officer_class', '==', 'class_b'),
          where('ward_id', '==', ticketData.ward)
        );
        
        const wardOfficersSnapshot = await getDocs(wardOfficersQuery);
        
        wardOfficersSnapshot.forEach((doc) => {
          const officer = doc.data();
          if (officer.email) {
            wardOfficerEmails.push(officer.email);
          }
        });

        console.log(`[Create Manual Ticket] Found ${wardOfficerEmails.length} Class B ward officers for ward ${ticketData.ward}`);

      } catch (emailFetchError) {
        console.error('[Create Manual Ticket] Error fetching ward officers:', emailFetchError);
      }
    }

    // Fallback: If no ward-specific officers, get Class A officers
    if (wardOfficerEmails.length === 0) {
      try {
        const usersRef = collection(db, 'users');
        const classAQuery = query(
          usersRef,
          where('role', '==', 'officer'),
          where('officer_class', '==', 'class_a')
        );
        
        const classASnapshot = await getDocs(classAQuery);
        
        classASnapshot.forEach((doc) => {
          const officer = doc.data();
          if (officer.email) {
            wardOfficerEmails.push(officer.email);
          }
        });

        console.log(`[Create Manual Ticket] Fallback: Found ${wardOfficerEmails.length} Class A officers`);
        
      } catch (emailFetchError) {
        console.error('[Create Manual Ticket] Error fetching Class A officers:', emailFetchError);
      }
    }

    // Send email notifications (non-blocking)
    if (wardOfficerEmails.length > 0) {
      sendBulkWardOfficerEmails(completeTicketData, wardOfficerEmails)
        .then((result) => {
          if (result.success) {
            console.log(`[Create Manual Ticket] Email notifications sent: ${result.sent}/${result.total}`);
          } else {
            console.warn(`[Create Manual Ticket] Email notifications failed:`, result.error);
          }
        })
        .catch((err) => {
          console.error('[Create Manual Ticket] Email notification error:', err);
        });
    } else {
      console.warn(`[Create Manual Ticket] No ward officers found for notification - ticket ${docRef.id}`);
    }

    // Return success immediately
    return NextResponse.json(
      {
        success: true,
        ticket_id: docRef.id,
        id: docRef.id,
        message: 'Ticket created successfully',
        notification_sent: wardOfficerEmails.length > 0
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Create Manual Ticket] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create ticket' },
      { status: 500 }
    );
  }
}
