import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, Timestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { sendCitizenStatusUpdate } from '@/lib/emailService';

// Ticket status constants
const TICKET_STATUS = {
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved'
};

/**
 * PATCH /api/tickets/[id]/assign
 * Assign a ticket to a class_c officer or contractor
 * 
 * Role Access: class_b officer only
 * Status Transition: pending → assigned
 */
export async function PATCH(request, { params }) {
  try {
    const { id: ticketId } = await params;
    const body = await request.json();
    const { assigned_to, assigned_by, user_role } = body;

    // Validate required fields
    if (!assigned_to || !assigned_by) {
      return NextResponse.json(
        { error: 'Missing required fields: assigned_to, assigned_by' },
        { status: 400 }
      );
    }

    // Authorization: Only class_b officers can assign tickets
    if (user_role !== 'officer') {
      return NextResponse.json(
        { error: 'Unauthorized: Only officers can assign tickets' },
        { status: 403 }
      );
    }

    // Get the assigning officer's details to verify class_b
    const assigningOfficerRef = doc(db, 'users', assigned_by);
    const assigningOfficerSnap = await getDoc(assigningOfficerRef);
    
    if (!assigningOfficerSnap.exists()) {
      return NextResponse.json(
        { error: 'Assigning officer not found' },
        { status: 404 }
      );
    }

    const assigningOfficer = assigningOfficerSnap.data();
    if (assigningOfficer.class !== 'class_b') {
      return NextResponse.json(
        { error: 'Unauthorized: Only class_b officers can assign tickets' },
        { status: 403 }
      );
    }

    // Get ticket document
    const ticketRef = doc(db, 'tickets', ticketId);
    const ticketSnap = await getDoc(ticketRef);

    if (!ticketSnap.exists()) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    const ticket = ticketSnap.data();

    // Validate status transition: must be 'pending'
    if (ticket.status !== TICKET_STATUS.PENDING) {
      return NextResponse.json(
        { error: `Invalid status transition. Ticket must be in 'pending' status to assign. Current status: ${ticket.status}` },
        { status: 400 }
      );
    }

    // Verify assigned_to user exists and get their details
    const assignedUserRef = doc(db, 'users', assigned_to);
    const assignedUserSnap = await getDoc(assignedUserRef);

    if (!assignedUserSnap.exists()) {
      return NextResponse.json(
        { error: 'Assigned user not found' },
        { status: 404 }
      );
    }

    const assignedUser = assignedUserSnap.data();
    
    // Verify assigned user is either class_c officer or contractor
    const isValidAssignee = 
      (assignedUser.role === 'officer' && assignedUser.class === 'class_c') ||
      assignedUser.role === 'contractor';

    if (!isValidAssignee) {
      return NextResponse.json(
        { error: 'Can only assign to class_c officers or contractors' },
        { status: 400 }
      );
    }

    // Update ticket with assignment details
    await updateDoc(ticketRef, {
      status: TICKET_STATUS.ASSIGNED,
      assigned_to: assigned_to,
      assigned_by: assigned_by,
      assigned_at: Timestamp.now(),
      updated_at: Timestamp.now()
    });

    // Send email notification to citizen (non-blocking)
    try {
      // Get citizen email
      const citizenRef = doc(db, 'users', ticket.citizen_id);
      const citizenSnap = await getDoc(citizenRef);
      
      if (citizenSnap.exists()) {
        const citizen = citizenSnap.data();
        if (citizen.email) {
          const ticketData = {
            ticket_id: ticketId,
            title: ticket.title,
            description: ticket.description,
            issue_type: ticket.issue_type,
            department: ticket.department,
            ward: ticket.ward
          };

          const statusData = {
            status: TICKET_STATUS.ASSIGNED,
            officer_name: assignedUser.name || 'Municipal Officer',
            officer_department: ticket.department,
            updated_at: new Date()
          };

          sendCitizenStatusUpdate(ticketData, statusData, citizen.email)
            .catch(err => console.error('[Assign API] Email notification failed:', err));
        }
      }
    } catch (emailError) {
      console.error('[Assign API] Email notification error:', emailError);
      // Don't fail the API if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Ticket assigned successfully',
      ticket_id: ticketId,
      status: TICKET_STATUS.ASSIGNED,
      assigned_to: assigned_to,
      assigned_by: assigned_by,
      assigned_at: new Date()
    });

  } catch (error) {
    console.error('[Assign API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
