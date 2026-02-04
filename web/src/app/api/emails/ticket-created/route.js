import { TicketCreatedEmail } from '@/components/emails/TicketCreatedEmail';
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
      description,
      location,
      priority = 'medium',
      createdAt
    } = body;

    if (!email || !ticketId) {
      return Response.json(
        { error: 'Missing required fields: email, ticketId' },
        { status: 400 }
      );
    }

    const { data, error } = await resend.emails.send({
      from: 'City Infrastructure <noreply@case-municipality.com>',
      to: [email],
      subject: `🎟️ Ticket Created: ${ticketId}`,
      react: TicketCreatedEmail({
        ticketId,
        issueType,
        title,
        description,
        location,
        priority,
        createdAt: createdAt || new Date().toISOString()
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
      message: 'Ticket created email sent successfully',
      data
    });
  } catch (error) {
    console.error('Error sending ticket created email:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
