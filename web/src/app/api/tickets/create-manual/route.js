import { NextResponse } from 'next/server';

// This is a client-side API route that handles ticket creation
// Since we're using Firebase client SDK in the frontend, we can directly use reportService
// This endpoint serves as a proxy to validate and process the ticket data

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

    // Note: Since we're using Firebase client SDK on the frontend,
    // the actual Firestore write happens on the client side in page.jsx
    // This endpoint just validates the data
    
    // Generate ticket ID
    const ticketId = `TICKET-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Return success response with ticket ID
    return NextResponse.json(
      {
        success: true,
        ticket_id: ticketId,
        id: ticketId,
        message: 'Ticket validation successful',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error processing ticket:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process ticket' },
      { status: 500 }
    );
  }
}
