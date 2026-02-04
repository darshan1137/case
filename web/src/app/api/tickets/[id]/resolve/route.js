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
 * PATCH /api/tickets/[id]/resolve
 * Mark a ticket as resolved
 * 
 * Role Access: class_b officer, class_c officer (if assigned), contractor (if assigned)
 * Status Transition: in_progress → resolved
 */
export async function PATCH(request, { params }) {
  try {
    const { id: ticketId } = params;
    const body = await request.json();
    const { user_id, user_role, officer_class, resolution_notes } = body;

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

    // Validate status transition: must be 'in_progress'
    if (ticket.status !== TICKET_STATUS.IN_PROGRESS) {
      return NextResponse.json(
        { error: `Invalid status transition. Ticket must be in 'in_progress' status to resolve. Current status: ${ticket.status}` },
        { status: 400 }
      );
    }

    // Authorization check
    const isOfficer = user_role === 'officer';
    const isContractor = user_role === 'contractor';
    const isClassB = officer_class === 'class_b';
    const isAssignedUser = ticket.assigned_to === user_id;

    // class_b can resolve any ticket, class_c/contractor must be assigned
    if (isOfficer && isClassB) {
      // class_b officer can resolve any ticket
    } else if ((isOfficer || isContractor) && isAssignedUser) {
      // class_c officer or contractor can resolve if assigned to them
    } else {
      return NextResponse.json(
        { error: 'Unauthorized: You must be assigned to this ticket or be a class_b officer to resolve it' },
        { status: 403 }
      );
    }

    // Get user details for email
    const userRef = doc(db, 'users', user_id);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.exists() ? userSnap.data() : {};

    // Update ticket status to resolved
    const updateData = {
      status: TICKET_STATUS.RESOLVED,
      resolved_by: user_id,
      resolved_at: Timestamp.now(),
      updated_at: Timestamp.now()
    };

    // Add resolution notes if provided
    if (resolution_notes) {
      updateData.resolution_notes = resolution_notes;
    }

    await updateDoc(ticketRef, updateData);

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
            status: TICKET_STATUS.RESOLVED,
            officer_name: userData.name || 'Municipal Staff',
            officer_department: ticket.department,
            updated_at: new Date()
          };

          sendCitizenStatusUpdate(ticketData, statusData, citizen.email)
            .catch(err => console.error('[Resolve API] Email notification failed:', err));
        }
      }
    } catch (emailError) {
      console.error('[Resolve API] Email notification error:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: 'Ticket resolved successfully',
      ticket_id: ticketId,
      status: TICKET_STATUS.RESOLVED,
      resolved_by: user_id,
      resolved_at: new Date(),
      resolution_notes: resolution_notes || null
    });

  } catch (error) {
    console.error('[Resolve API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
