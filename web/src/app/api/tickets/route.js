import { NextResponse } from 'next/server';
import { collection, getDocs, addDoc, updateDoc, doc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { sendWardOfficerEmail, sendBulkWardOfficerEmails } from '@/lib/emailService';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const role = searchParams.get('role');
    const classType = searchParams.get('class'); // class_a, class_b, class_c, citizen
    const ward = searchParams.get('ward');
    const filterType = searchParams.get('filterType') || 'all'; // all, my, assigned
    const search = searchParams.get('search');
    const status = searchParams.get('status');

    // Determine role from class parameter if provided
    const effectiveRole = classType || role;

    // Validate: if using role/userId (old way), require both; if using class (new way), that's enough
    if (!effectiveRole) {
      return NextResponse.json(
        { error: 'Missing class or role parameter' },
        { status: 400 }
      );
    }

    // userId is required for citizen and assigned filter, but optional for class_a
    if ((effectiveRole === 'citizen' || filterType === 'assigned') && !userId) {
      return NextResponse.json(
        { error: 'Missing userId for citizen filter or assigned filter' },
        { status: 400 }
      );
    }

    const ticketsRef = collection(db, 'tickets');
    let constraints = [];

    // Role-based filtering
    if (effectiveRole === 'citizen') {
      // Citizens can only see their own tickets
      constraints.push(where('citizen_id', '==', userId));
    } else if (effectiveRole === 'class_a') {
      // Class A officers can see all tickets
      // No additional constraint
    } else if (effectiveRole === 'class_b' || effectiveRole === 'class_c') {
      // Class B and C officers can only see tickets from their ward
      if (!ward) {
        return NextResponse.json(
          { error: 'Ward information required for class_b/class_c officers' },
          { status: 400 }
        );
      }

      // Filter by ward if available (assumes ticket has ward field)
      // If ticket doesn't have ward, we'll filter on the client side
      constraints.push(where('is_active', '==', true));
    } else {
      return NextResponse.json(
        { error: 'Invalid class/role parameter' },
        { status: 400 }
      );
    }

    // Additional filters
    if (status) {
      constraints.push(where('status', '==', status));
    }

    // Build and execute query
    const q = constraints.length > 0 
      ? query(ticketsRef, ...constraints)
      : ticketsRef;

    const querySnapshot = await getDocs(q);
    let tickets = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      tickets.push({
        id: doc.id,
        ...data
      });
    });

    // Client-side filtering for ward (if class_b/class_c)
    if ((effectiveRole === 'class_b' || effectiveRole === 'class_c') && ward) {
      // This is a simplified filter - if tickets have ward field, use it
      // Otherwise, this filtering might need to be adjusted based on your data structure
      tickets = tickets.filter(ticket => {
        return !ticket.ward || ticket.ward === ward;
      });
    }

    // Assigned tickets filter (for class_b officers)
    if (filterType === 'assigned' && (effectiveRole === 'class_b' || effectiveRole === 'class_a') && userId) {
      // Filter tickets assigned to this officer (could be stored as assigned_to field)
      tickets = tickets.filter(ticket => 
        ticket.assigned_to === userId || ticket.assigned_officer_id === userId
      );
    }

    // Search filter (search in title, description, issue_type)
    if (search) {
      const searchLower = search.toLowerCase();
      tickets = tickets.filter(ticket => 
        ticket.title?.toLowerCase().includes(searchLower) ||
        ticket.description?.toLowerCase().includes(searchLower) ||
        ticket.issue_type?.toLowerCase().includes(searchLower) ||
        ticket.ticket_id?.toLowerCase().includes(searchLower)
      );
    }

    // Sort by created_at (newest first)
    tickets.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return NextResponse.json(
      {
        success: true,
        count: tickets.length,
        tickets: tickets
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tickets - Create a new ticket and send email notification to ward officer
 */
export async function POST(request) {
  try {
    const ticketData = await request.json();

    // Validate required fields
    if (!ticketData.citizen_id || !ticketData.title || !ticketData.description) {
      return NextResponse.json(
        { error: 'Missing required fields: citizen_id, title, description' },
        { status: 400 }
      );
    }

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

    console.log(`[Tickets API] Ticket created: ${docRef.id}`);

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
        
        // Try to find Class C officers (ward-specific) first
        const wardOfficersQuery = query(
          usersRef,
          where('role', '==', 'officer'),
          where('class', '==', 'class_b'),
          where('ward_id', '==', ticketData.ward)
        );
        
        const wardOfficersSnapshot = await getDocs(wardOfficersQuery);
        
        wardOfficersSnapshot.forEach((doc) => {
          const officer = doc.data();
          if (officer.email) {
            wardOfficerEmails.push(officer.email);
          }
        });

        console.log(`[Tickets API] Found ${wardOfficerEmails.length} Class B ward officers for ward ${ticketData.ward}`);

      } catch (emailFetchError) {
        console.error('[Tickets API] Error fetching ward officers:', emailFetchError);
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

        console.log(`[Tickets API] Fallback: Found ${wardOfficerEmails.length} Class A officers`);
        
      } catch (emailFetchError) {
        console.error('[Tickets API] Error fetching Class A officers:', emailFetchError);
      }
    }

    // Send email notifications (non-blocking - don't fail ticket creation)
    if (wardOfficerEmails.length > 0) {
      // Send emails asynchronously without blocking the response
      sendBulkWardOfficerEmails(completeTicketData, wardOfficerEmails)
        .then((result) => {
          if (result.success) {
            console.log(`[Tickets API] Email notifications sent: ${result.sent}/${result.total}`);
          } else {
            console.warn(`[Tickets API] Email notifications failed:`, result.error);
          }
        })
        .catch((err) => {
          console.error('[Tickets API] Email notification error:', err);
        });
    } else {
      console.warn(`[Tickets API] No ward officers found for notification - ticket ${docRef.id}`);
    }

    // Return success immediately (don't wait for email)
    return NextResponse.json(
      {
        success: true,
        ticket_id: docRef.id,
        message: 'Ticket created successfully',
        notification_sent: wardOfficerEmails.length > 0
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('[Tickets API] Error creating ticket:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create ticket' },
      { status: 500 }
    );
  }
}
