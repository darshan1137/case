import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Generate HTML email template for ward officer notification
 */
const generateWardOfficerEmailTemplate = (ticketData) => {
  const { 
    ticket_id, 
    title, 
    description, 
    issue_type, 
    department,
    severity_level, 
    ward,
    citizen_name,
    citizen_phone,
    location,
    created_at 
  } = ticketData;

  const priorityColors = {
    low: '#10B981',
    medium: '#F59E0B',
    high: '#EF4444',
    critical: '#DC2626'
  };

  const priorityColor = priorityColors[severity_level?.toLowerCase()] || priorityColors.medium;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Ticket Notification</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; background-color: #F3F4F6; }
        .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #2563EB 0%, #7C3AED 100%); padding: 30px 20px; text-align: center; }
        .logo { width: 80px; height: 80px; margin-bottom: 15px; }
        .header h1 { color: #ffffff; font-size: 28px; font-weight: 700; margin-bottom: 5px; }
        .tagline { color: #E0E7FF; font-size: 14px; letter-spacing: 2px; font-weight: 500; }
        .content { padding: 30px 20px; }
        .alert-badge { background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; border-radius: 8px; margin-bottom: 25px; }
        .alert-badge p { color: #92400E; font-size: 14px; font-weight: 600; }
        .card { background-color: #F9FAFB; border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid #E5E7EB; }
        .card-title { color: #374151; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
        .card-value { color: #111827; font-size: 16px; font-weight: 500; }
        .priority-badge { display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #ffffff; }
        .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
        .detail-item { background-color: #F9FAFB; padding: 15px; border-radius: 8px; border: 1px solid #E5E7EB; }
        .detail-label { color: #6B7280; font-size: 12px; font-weight: 600; margin-bottom: 5px; }
        .detail-value { color: #111827; font-size: 14px; font-weight: 500; }
        .description-box { background-color: #F9FAFB; padding: 20px; border-radius: 12px; border: 1px solid #E5E7EB; margin-bottom: 25px; }
        .description-box p { color: #374151; font-size: 14px; line-height: 1.8; }
        .cta-button { display: block; width: 100%; background: linear-gradient(135deg, #2563EB 0%, #7C3AED 100%); color: #ffffff; text-align: center; padding: 16px 24px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 16px; margin-top: 25px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3); }
        .cta-button:hover { box-shadow: 0 6px 8px rgba(37, 99, 235, 0.4); }
        .footer { background-color: #F9FAFB; padding: 25px 20px; text-align: center; border-top: 1px solid #E5E7EB; }
        .footer p { color: #6B7280; font-size: 12px; margin-bottom: 8px; }
        .footer .brand { color: #2563EB; font-weight: 700; }
        @media only screen and (max-width: 600px) {
          .details-grid { grid-template-columns: 1fr; }
          .header h1 { font-size: 24px; }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <!-- Header -->
        <div class="header">
          <img src="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/logo.svg" alt="CASE Logo" class="logo">
          <h1>CASE</h1>
          <p class="tagline">CAPTURE • ASSESS • SERVE • EVOLVE</p>
        </div>

        <!-- Content -->
        <div class="content">
          <!-- Alert Badge -->
          <div class="alert-badge">
            <p>⚠️ New Civic Complaint Assigned to Your Ward</p>
          </div>

          <!-- Ticket ID Card -->
          <div class="card">
            <div class="card-title">Ticket ID</div>
            <div class="card-value" style="font-family: monospace; color: #2563EB;">${ticket_id}</div>
          </div>

          <!-- Priority Badge -->
          <div style="margin-bottom: 20px;">
            <span class="priority-badge" style="background-color: ${priorityColor};">
              ${severity_level?.toUpperCase() || 'MEDIUM'} PRIORITY
            </span>
          </div>

          <!-- Details Grid -->
          <div class="details-grid">
            <div class="detail-item">
              <div class="detail-label">Category</div>
              <div class="detail-value">${issue_type || 'General'}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Department</div>
              <div class="detail-value">${department || 'Municipal'}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Ward</div>
              <div class="detail-value">${ward || 'N/A'}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Reported On</div>
              <div class="detail-value">${new Date(created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
            </div>
          </div>

          <!-- Complaint Title -->
          <div class="card">
            <div class="card-title">Complaint Title</div>
            <div class="card-value">${title || 'Untitled Complaint'}</div>
          </div>

          <!-- Description -->
          <div class="description-box">
            <div class="detail-label" style="margin-bottom: 10px;">Description</div>
            <p>${description || 'No description provided.'}</p>
          </div>

          <!-- Citizen Information -->
          <div class="card">
            <div class="card-title">Reported By</div>
            <div class="card-value">${citizen_name || 'Anonymous'}</div>
            ${citizen_phone ? `<p style="color: #6B7280; font-size: 14px; margin-top: 5px;">📞 ${citizen_phone}</p>` : ''}
          </div>

          ${location ? `
          <div class="card">
            <div class="card-title">Location</div>
            <div class="card-value">${location}</div>
          </div>
          ` : ''}

          <!-- CTA Button -->
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://case.codinggurus.in'}/officer/tickets/${ticket_id}" class="cta-button">
            View Ticket Details →
          </a>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p>This is an automated notification from CASE</p>
          <p>Civic Action & Service Excellence Platform</p>
          <p style="margin-top: 15px;">Powered by <span class="brand">CodingGurus</span></p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Send email notification to ward officer
 * @param {Object} ticketData - Ticket information
 * @param {string} wardOfficerEmail - Ward officer's email address
 * @returns {Promise<Object>} - Result of email send operation
 */
export const sendWardOfficerEmail = async (ticketData, wardOfficerEmail) => {
  try {
    if (!wardOfficerEmail) {
      console.warn(`[Email Service] No ward officer email provided for ticket ${ticketData.ticket_id}`);
      return { success: false, error: 'No ward officer email provided' };
    }

    if (!process.env.RESEND_API_KEY) {
      console.error('[Email Service] RESEND_API_KEY not configured');
      return { success: false, error: 'Email service not configured' };
    }

    const emailHtml = generateWardOfficerEmailTemplate(ticketData);

    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'CASE <noreply@codinggurus.in>',
      to: wardOfficerEmail,
      subject: `🚨 New Complaint: ${ticketData.title || 'Civic Issue'} - Ticket #${ticketData.ticket_id}`,
      html: emailHtml,
    });

    console.log(`[Email Service] Email sent successfully to ${wardOfficerEmail} for ticket ${ticketData.ticket_id}`);
    return { success: true, messageId: result.id };

  } catch (error) {
    console.error('[Email Service] Failed to send email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send email to multiple ward officers (for escalation or Class A officers)
 */
export const sendBulkWardOfficerEmails = async (ticketData, officerEmails) => {
  try {
    if (!officerEmails || officerEmails.length === 0) {
      console.warn(`[Email Service] No officer emails provided for ticket ${ticketData.ticket_id}`);
      return { success: false, error: 'No officer emails provided' };
    }

    const emailPromises = officerEmails.map(email => 
      sendWardOfficerEmail(ticketData, email)
    );

    const results = await Promise.allSettled(emailPromises);
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;

    console.log(`[Email Service] Sent ${successful}/${officerEmails.length} emails for ticket ${ticketData.ticket_id}`);
    
    return { 
      success: successful > 0, 
      sent: successful, 
      total: officerEmails.length 
    };

  } catch (error) {
    console.error('[Email Service] Bulk email send failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Generate HTML email template for citizen ticket status update
 */
const generateCitizenStatusUpdateTemplate = (ticketData, statusData) => {
  const { ticket_id, title, description, issue_type, department, ward } = ticketData;
  const { status, officer_name, officer_department, updated_at } = statusData;

  const statusConfig = {
    assigned: {
      color: '#3B82F6',
      icon: '👤',
      title: 'Ticket Assigned',
      message: 'Your complaint has been assigned to an officer for review.'
    },
    in_progress: {
      color: '#F59E0B',
      icon: '⚙️',
      title: 'Work In Progress',
      message: 'Work has started on your complaint. Our team is actively addressing the issue.'
    },
    resolved: {
      color: '#10B981',
      icon: '✅',
      title: 'Issue Resolved',
      message: 'Your complaint has been successfully resolved. Thank you for helping improve our community!'
    }
  };

  const config = statusConfig[status] || statusConfig.assigned;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Ticket Status Update</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; background-color: #F3F4F6; }
        .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #2563EB 0%, #7C3AED 100%); padding: 30px 20px; text-align: center; }
        .logo { width: 80px; height: 80px; margin-bottom: 15px; }
        .header h1 { color: #ffffff; font-size: 28px; font-weight: 700; margin-bottom: 5px; }
        .tagline { color: #E0E7FF; font-size: 14px; letter-spacing: 2px; font-weight: 500; }
        .content { padding: 30px 20px; }
        .status-badge { background-color: ${config.color}; color: #ffffff; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 25px; }
        .status-icon { font-size: 48px; margin-bottom: 10px; }
        .status-title { font-size: 24px; font-weight: 700; margin-bottom: 8px; }
        .status-message { font-size: 14px; opacity: 0.95; }
        .card { background-color: #F9FAFB; border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid #E5E7EB; }
        .card-title { color: #374151; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
        .card-value { color: #111827; font-size: 16px; font-weight: 500; }
        .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
        .detail-item { background-color: #F9FAFB; padding: 15px; border-radius: 8px; border: 1px solid #E5E7EB; }
        .detail-label { color: #6B7280; font-size: 12px; font-weight: 600; margin-bottom: 5px; }
        .detail-value { color: #111827; font-size: 14px; font-weight: 500; }
        .cta-button { display: block; width: 100%; background: linear-gradient(135deg, #2563EB 0%, #7C3AED 100%); color: #ffffff; text-align: center; padding: 16px 24px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 16px; margin-top: 25px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3); }
        .cta-button:hover { box-shadow: 0 6px 8px rgba(37, 99, 235, 0.4); }
        .footer { background-color: #F9FAFB; padding: 25px 20px; text-align: center; border-top: 1px solid #E5E7EB; }
        .footer p { color: #6B7280; font-size: 12px; margin-bottom: 8px; }
        .footer .brand { color: #2563EB; font-weight: 700; }
        @media only screen and (max-width: 600px) {
          .details-grid { grid-template-columns: 1fr; }
          .header h1 { font-size: 24px; }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <!-- Header -->
        <div class="header">
          <img src="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/logo.svg" alt="CASE Logo" class="logo">
          <h1>CASE</h1>
          <p class="tagline">CAPTURE • ASSESS • SERVE • EVOLVE</p>
        </div>

        <!-- Content -->
        <div class="content">
          <!-- Status Badge -->
          <div class="status-badge">
            <div class="status-icon">${config.icon}</div>
            <div class="status-title">${config.title}</div>
            <div class="status-message">${config.message}</div>
          </div>

          <!-- Ticket ID Card -->
          <div class="card">
            <div class="card-title">Ticket ID</div>
            <div class="card-value" style="font-family: monospace; color: #2563EB;">${ticket_id}</div>
          </div>

          <!-- Details Grid -->
          <div class="details-grid">
            <div class="detail-item">
              <div class="detail-label">Category</div>
              <div class="detail-value">${issue_type || 'General'}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Department</div>
              <div class="detail-value">${department || 'Municipal'}</div>
            </div>
            ${ward ? `
            <div class="detail-item">
              <div class="detail-label">Ward</div>
              <div class="detail-value">${ward}</div>
            </div>
            ` : ''}
            <div class="detail-item">
              <div class="detail-label">Updated On</div>
              <div class="detail-value">${new Date(updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </div>

          <!-- Complaint Title -->
          <div class="card">
            <div class="card-title">Complaint Title</div>
            <div class="card-value">${title || 'Untitled Complaint'}</div>
          </div>

          ${officer_name ? `
          <!-- Officer Information -->
          <div class="card">
            <div class="card-title">Handled By</div>
            <div class="card-value">${officer_name}</div>
            ${officer_department ? `<p style="color: #6B7280; font-size: 14px; margin-top: 5px;">${officer_department}</p>` : ''}
          </div>
          ` : ''}

          <!-- CTA Button -->
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/citizen/track?ticket=${ticket_id}" class="cta-button">
            Track Ticket Status →
          </a>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p>This is an automated notification from CASE</p>
          <p>Civic Action & Service Excellence Platform</p>
          <p style="margin-top: 15px;">Powered by <span class="brand">CodingGurus</span></p>
          <p style="margin-top: 10px; font-size: 11px; color: #9CA3AF;">
            If you have questions, please contact your local civic office.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Send status update email to citizen
 * @param {Object} ticketData - Ticket information
 * @param {Object} statusData - Status update details (status, officer_name, officer_department, updated_at)
 * @param {string} citizenEmail - Citizen's email address
 * @returns {Promise<Object>} - Result of email send operation
 */
export const sendCitizenStatusUpdate = async (ticketData, statusData, citizenEmail) => {
  try {
    if (!citizenEmail) {
      console.warn(`[Email Service] No citizen email provided for ticket ${ticketData.ticket_id}`);
      return { success: false, error: 'No citizen email provided' };
    }

    if (!process.env.RESEND_API_KEY) {
      console.error('[Email Service] RESEND_API_KEY not configured');
      return { success: false, error: 'Email service not configured' };
    }

    const emailHtml = generateCitizenStatusUpdateTemplate(ticketData, statusData);

    const statusTitles = {
      assigned: 'Assigned',
      in_progress: 'In Progress',
      resolved: 'Resolved'
    };

    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'CASE <noreply@codinggurus.in>',
      to: citizenEmail,
      subject: `${statusTitles[statusData.status] || 'Updated'}: Your Complaint #${ticketData.ticket_id}`,
      html: emailHtml,
    });

    console.log(`[Email Service] Status update email sent to ${citizenEmail} for ticket ${ticketData.ticket_id}`);
    return { success: true, messageId: result.id };

  } catch (error) {
    console.error('[Email Service] Failed to send status update email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Generate HTML email template for contractor onboarding
 */
const generateContractorOnboardingTemplate = (contractorData, tempPassword, createdByName) => {
  const { name, email } = contractorData;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to CASE</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; background-color: #F3F4F6; }
        .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #2563EB 0%, #7C3AED 100%); padding: 30px 20px; text-align: center; }
        .logo { width: 80px; height: 80px; margin-bottom: 15px; }
        .header h1 { color: #ffffff; font-size: 28px; font-weight: 700; margin-bottom: 5px; }
        .tagline { color: #E0E7FF; font-size: 14px; letter-spacing: 2px; font-weight: 500; }
        .content { padding: 30px 20px; }
        .welcome-badge { background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: #ffffff; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 25px; }
        .welcome-icon { font-size: 48px; margin-bottom: 10px; }
        .welcome-title { font-size: 24px; font-weight: 700; margin-bottom: 8px; }
        .welcome-message { font-size: 14px; opacity: 0.95; }
        .card { background-color: #F9FAFB; border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid #E5E7EB; }
        .card-title { color: #374151; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
        .card-value { color: #111827; font-size: 16px; font-weight: 500; font-family: monospace; background-color: #ffffff; padding: 12px; border-radius: 8px; border: 2px dashed #D1D5DB; }
        .info-box { background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .info-box p { color: #92400E; font-size: 14px; }
        .cta-button { display: block; width: 100%; background: linear-gradient(135deg, #2563EB 0%, #7C3AED 100%); color: #ffffff; text-align: center; padding: 16px 24px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 16px; margin-top: 25px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3); }
        .cta-button:hover { box-shadow: 0 6px 8px rgba(37, 99, 235, 0.4); }
        .steps { margin: 25px 0; }
        .step { display: flex; align-items: start; margin-bottom: 15px; }
        .step-number { background: linear-gradient(135deg, #2563EB 0%, #7C3AED 100%); color: #ffffff; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; margin-right: 12px; flex-shrink: 0; }
        .step-content { flex: 1; }
        .step-title { font-weight: 600; color: #111827; margin-bottom: 4px; }
        .step-text { color: #6B7280; font-size: 14px; }
        .footer { background-color: #F9FAFB; padding: 25px 20px; text-align: center; border-top: 1px solid #E5E7EB; }
        .footer p { color: #6B7280; font-size: 12px; margin-bottom: 8px; }
        .footer .brand { color: #2563EB; font-weight: 700; }
      </style>
    </head>
    <body>
      <div class="email-container">
        <!-- Header -->
        <div class="header">
          <img src="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/logo.svg" alt="CASE Logo" class="logo">
          <h1>CASE</h1>
          <p class="tagline">CAPTURE • ASSESS • SERVE • EVOLVE</p>
        </div>

        <!-- Content -->
        <div class="content">
          <!-- Welcome Badge -->
          <div class="welcome-badge">
            <div class="welcome-icon">🎉</div>
            <div class="welcome-title">Welcome to CASE!</div>
            <div class="welcome-message">Your contractor account has been created</div>
          </div>

          <!-- Greeting -->
          <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">
            Hello <strong>${name}</strong>,
          </p>

          <p style="color: #6B7280; font-size: 14px; margin-bottom: 25px; line-height: 1.8;">
            Your contractor account has been created by <strong>${createdByName}</strong> on the CASE platform. 
            You can now log in to view and manage civic work orders assigned to you.
          </p>

          <!-- Login Credentials -->
          <div class="card">
            <div class="card-title">Login Email</div>
            <div class="card-value">${email}</div>
          </div>

          <div class="card">
            <div class="card-title">Temporary Password</div>
            <div class="card-value">${tempPassword}</div>
          </div>

          <!-- Important Notice -->
          <div class="info-box">
            <p>⚠️ <strong>Important:</strong> Please change your password after your first login for security.</p>
          </div>

          <!-- Getting Started Steps -->
          <div style="margin: 30px 0;">
            <h3 style="color: #111827; font-size: 18px; font-weight: 700; margin-bottom: 20px;">Getting Started</h3>
            
            <div class="steps">
              <div class="step">
                <div class="step-number">1</div>
                <div class="step-content">
                  <div class="step-title">Login to Your Account</div>
                  <div class="step-text">Click the button below to access the CASE platform</div>
                </div>
              </div>
              
              <div class="step">
                <div class="step-number">2</div>
                <div class="step-content">
                  <div class="step-title">Change Your Password</div>
                  <div class="step-text">Navigate to Profile → Change Password to set a new password</div>
                </div>
              </div>
              
              <div class="step">
                <div class="step-number">3</div>
                <div class="step-content">
                  <div class="step-title">Complete Your Profile</div>
                  <div class="step-text">Add your company details and service areas</div>
                </div>
              </div>
              
              <div class="step">
                <div class="step-number">4</div>
                <div class="step-content">
                  <div class="step-title">Start Accepting Work Orders</div>
                  <div class="step-text">View assigned jobs and begin serving your community</div>
                </div>
              </div>
            </div>
          </div>

          <!-- CTA Button -->
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/login" class="cta-button">
            Login to CASE →
          </a>

          <!-- Support Info -->
          <div style="margin-top: 30px; padding: 20px; background-color: #F9FAFB; border-radius: 8px;">
            <p style="color: #6B7280; font-size: 13px; text-align: center; line-height: 1.6;">
              Need help? Contact your municipal officer or visit our support center.<br>
              If you did not expect this email, please contact us immediately.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p>This is an automated notification from CASE</p>
          <p>Civic Action & Service Excellence Platform</p>
          <p style="margin-top: 15px;">Powered by <span class="brand">CodingGurus</span></p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Send onboarding email to newly created contractor
 * @param {Object} contractorData - Contractor information
 * @param {string} tempPassword - Temporary password for first login
 * @param {string} createdByName - Name of the officer who created the account
 * @returns {Promise<Object>} - Result of email send operation
 */
export const sendContractorOnboardingEmail = async (contractorData, tempPassword, createdByName) => {
  try {
    if (!contractorData.email) {
      console.warn('[Email Service] No contractor email provided');
      return { success: false, error: 'No contractor email provided' };
    }

    if (!process.env.RESEND_API_KEY) {
      console.error('[Email Service] RESEND_API_KEY not configured');
      return { success: false, error: 'Email service not configured' };
    }

    const emailHtml = generateContractorOnboardingTemplate(contractorData, tempPassword, createdByName);

    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'CASE <noreply@codinggurus.in>',
      to: contractorData.email,
      subject: '🎉 Welcome to CASE - Your Contractor Account is Ready',
      html: emailHtml,
    });

    console.log(`[Email Service] Onboarding email sent to contractor ${contractorData.email}`);
    return { success: true, messageId: result.id };

  } catch (error) {
    console.error('[Email Service] Failed to send contractor onboarding email:', error);
    return { success: false, error: error.message };
  }
};
