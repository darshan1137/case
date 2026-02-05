import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  import { Resend } from 'resend';
  import { NextResponse } from 'next/server';

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set. Email endpoint will fail without it.');
  }
  const resend = new Resend(RESEND_API_KEY);

  /**
   * POST /api/notifications/email
   * Body: { to, ticketId, ticketTitle, oldStatus, newStatus, assignedTo, resolvedBy, notes }
   */
  export async function POST(request) {
    try {
      const body = await request.json();
      const {
        to,
        ticketId,
        ticketTitle = '',
        oldStatus = '',
        newStatus,
        assignedTo,
        resolvedBy,
        notes,
      } = body || {};

      if (!to || !ticketId || !newStatus) {
        return NextResponse.json(
          { error: 'Missing required fields: to, ticketId, newStatus' },
          { status: 400 }
        );
      }

      if (!RESEND_API_KEY) {
        return NextResponse.json({ error: 'Server misconfigured: missing RESEND_API_KEY' }, { status: 500 });
      }

      const subject = `Ticket ${ticketId} Status Update: ${newStatus.toUpperCase()}`;

      let html = `
        <div style="font-family: Arial, sans-serif; max-width:600px;margin:0 auto;">
          <h2 style="color:#FF9933;margin-bottom:8px">Ticket Status Update</h2>
          <p>Hello,</p>
          <p>Your ticket <strong>${ticketId}</strong> has been updated.</p>
          <div style="background:#f8f9fa;padding:16px;border-radius:8px;margin:16px 0;">
            <p><strong>Title:</strong> ${ticketTitle}</p>
            <p><strong>Status:</strong> ${oldStatus || 'N/A'} → <strong style="color:#28a745">${newStatus.toUpperCase()}</strong></p>
      `;

      if (assignedTo) html += `<p><strong>Assigned To:</strong> ${assignedTo}</p>`;
      if (resolvedBy) html += `<p><strong>Resolved By:</strong> ${resolvedBy}</p>`;
      if (notes) html += `<p><strong>Notes:</strong> ${notes}</p>`;

      html += `
          </div>
          <p>Thank you for using our service.</p>
          <p style="color:#666;font-size:12px;margin-top:8px;">Automated notification from Case Management System.</p>
        </div>
      `;

      const resp = await resend.emails.send({
        from: 'notifications@yourdomain.com', // replace with your verified sender
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
      });

      return NextResponse.json({ success: true, messageId: resp.id || null }, { status: 200 });
    } catch (err) {
      console.error('[Email API] Error:', err);
      return NextResponse.json(
        { error: err?.message || 'Failed to send email notification' },
        { status: 500 }
      );
    }
  }
