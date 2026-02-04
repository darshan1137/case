import { NextResponse } from 'next/server';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const role = searchParams.get('role');
    const ward = searchParams.get('ward');
    const filterType = searchParams.get('filterType') || 'all'; // all, my, assigned
    const search = searchParams.get('search');
    const status = searchParams.get('status');

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'Missing userId or role' },
        { status: 400 }
      );
    }

    const ticketsRef = collection(db, 'tickets');
    let constraints = [];

    // Role-based filtering
    if (role === 'citizen') {
      // Citizens can only see their own tickets
      constraints.push(where('reporter_id', '==', userId));
    } else if (role === 'class_a') {
      // Class A officers can see all tickets
      // No additional constraint
    } else if (role === 'class_b' || role === 'class_c') {
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
        { error: 'Invalid role' },
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
    if ((role === 'class_b' || role === 'class_c') && ward) {
      // This is a simplified filter - if tickets have ward field, use it
      // Otherwise, this filtering might need to be adjusted based on your data structure
      tickets = tickets.filter(ticket => {
        return !ticket.ward || ticket.ward === ward;
      });
    }

    // Assigned tickets filter (for class_b officers)
    if (filterType === 'assigned' && (role === 'class_b' || role === 'class_a')) {
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
