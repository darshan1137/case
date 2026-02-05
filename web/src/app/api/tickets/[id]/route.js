import { NextResponse } from 'next/server';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function GET(request, { params }) {
  try {
    const { id: ticketId } = params;

    if (!ticketId) {
      return NextResponse.json({ error: 'Missing ticket id' }, { status: 400 });
    }

    const ticketRef = doc(db, 'tickets', ticketId);
    const ticketSnap = await getDoc(ticketRef);

    if (!ticketSnap.exists()) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const data = ticketSnap.data();
    return NextResponse.json({ success: true, ticket: { id: ticketSnap.id, ...data } }, { status: 200 });
  } catch (error) {
    console.error('[Ticket:id GET] Error fetching ticket:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch ticket' }, { status: 500 });
  }
}

// Optional: allow deleting a ticket by id
export async function DELETE(request, { params }) {
  try {
    const { id: ticketId } = params;
    if (!ticketId) return NextResponse.json({ error: 'Missing ticket id' }, { status: 400 });

    await deleteDoc(doc(db, 'tickets', ticketId));
    return NextResponse.json({ success: true, message: 'Ticket deleted' }, { status: 200 });
  } catch (error) {
    console.error('[Ticket:id DELETE] Error deleting ticket:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete ticket' }, { status: 500 });
  }
}

// Optional: partial update
export async function PATCH(request, { params }) {
  try {
    const { id: ticketId } = params;
    if (!ticketId) return NextResponse.json({ error: 'Missing ticket id' }, { status: 400 });

    const body = await request.json();
    await updateDoc(doc(db, 'tickets', ticketId), {
      ...body,
      updated_at: new Date().toISOString()
    });

    return NextResponse.json({ success: true, message: 'Ticket updated' }, { status: 200 });
  } catch (error) {
    console.error('[Ticket:id PATCH] Error updating ticket:', error);
    return NextResponse.json({ error: error.message || 'Failed to update ticket' }, { status: 500 });
  }
}
