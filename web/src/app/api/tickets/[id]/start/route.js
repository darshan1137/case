import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { sendCitizenStatusUpdate } from '@/lib/emailService';

// Ticket status constants
const TICKET_STATUS = {
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved'
};

/**
 * PATCH /api/tickets/[id]/start
 * Start work on a ticket
 * 
 * Role Access: class_b officer, class_c officer (if assigned), contractor (if assigned)
 * Status Transition: assigned → in_progress
 */
export async function PATCH(request, { params }) {
  try {
    const { id: ticketId } = await params;
    const body = await request.json();
    const { user_id, user_role, officer_class } = body;

    // Validate required fields
    if (!user_id) {
      return NextResponse.json(
        { error: 'Missing required field: user_id' },
        { status: 400 }
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

    // Validate status transition: must be 'assigned'
    if (ticket.status !== TICKET_STATUS.ASSIGNED) {
      return NextResponse.json(
        { error: `Invalid status transition. Ticket must be in 'assigned' status to start work. Current status: ${ticket.status}` },
        { status: 400 }
      );
    }

    // Authorization check
    const isOfficer = user_role === 'officer';
    const isContractor = user_role === 'contractor';
    const isClassB = officer_class === 'class_b';
    const isAssignedUser = ticket.assigned_to === user_id;

    // class_b can start any ticket, class_c/contractor must be assigned
    if (isOfficer && isClassB) {
      // class_b officer can start work on any ticket
    } else if ((isOfficer || isContractor) && isAssignedUser) {
      // class_c officer or contractor can start if assigned to them
    } else {
      return NextResponse.json(
        { error: 'Unauthorized: You must be assigned to this ticket or be a class_b officer to start work' },
        { status: 403 }
      );
    }

    // Get user details for email
    const userRef = doc(db, 'users', user_id);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.exists() ? userSnap.data() : {};

    // Update ticket status to in_progress
    await updateDoc(ticketRef, {
      status: TICKET_STATUS.IN_PROGRESS,
      in_progress_start_at: Timestamp.now(),
      updated_at: Timestamp.now()
    });

    // Send email notification to citizen (non-blocking)
    try {
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
            status: TICKET_STATUS.IN_PROGRESS,
            officer_name: userData.name || 'Municipal Staff',
            officer_department: ticket.department,
            updated_at: new Date()
          };

          sendCitizenStatusUpdate(ticketData, statusData, citizen.email)
            .catch(err => console.error('[Start API] Email notification failed:', err));
        }
      }
    } catch (emailError) {
      console.error('[Start API] Email notification error:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: 'Work started successfully',
      ticket_id: ticketId,
      status: TICKET_STATUS.IN_PROGRESS,
      in_progress_start_at: new Date()
    });

  } catch (error) {
    console.error('[Start API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
