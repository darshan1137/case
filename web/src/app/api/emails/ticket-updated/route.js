import { TicketUpdatedEmail } from '@/components/emails/TicketUpdatedEmail';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      email,
      ticketId,
      issueType,
      title,
      previousStatus,
      newStatus,
      priority = 'medium',
      updatedAt,
      notes,
      assignedTo
    } = body;

    if (!email || !ticketId || !previousStatus || !newStatus) {
      return Response.json(
        { error: 'Missing required fields: email, ticketId, previousStatus, newStatus' },
        { status: 400 }
      );
    }

    const { data, error } = await resend.emails.send({
      from: 'City Infrastructure <noreply@case-municipality.com>',
      to: [email],
      subject: `📢 Ticket ${ticketId} - Status Updated to ${newStatus.replace(/_/g, ' ').toUpperCase()}`,
      react: TicketUpdatedEmail({
        ticketId,
        issueType,
        title,
        previousStatus,
        newStatus,
        priority,
        updatedAt: updatedAt || new Date().toISOString(),
        notes,
        assignedTo
      })
    });

    if (error) {
      console.error('Resend error:', error);
      return Response.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      message: 'Ticket updated email sent successfully',
      data
    });
  } catch (error) {
    console.error('Error sending ticket updated email:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
