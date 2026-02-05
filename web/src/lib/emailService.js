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
        .logo { width: 80px; height: 80px; margin-bottom: 15px; background-color: #ffffff; border-radius: 50%; padding: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
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
          <img src="https://res.cloudinary.com/dahtmgyee/image/upload/v1770237614/hjf9nmxbh533sbwuyyl1.png" alt="CASE Logo" class="logo">
          <h1>CASE</h1>
          <p class="tagline">Capture • Assess • Serve • Evolve</p>
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
        .logo { width: 80px; height: 80px; margin-bottom: 15px; background-color: #ffffff; border-radius: 50%; padding: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
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
          <img src="https://res.cloudinary.com/dahtmgyee/image/upload/v1770241197/htegpj15jn2peip4ewji.png" alt="CASE Logo" class="logo">
          <h1>CASE</h1>
          <p class="tagline">Capture • Assess • Serve • Evolve</p>
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
        .logo { width: 80px; height: 80px; margin-bottom: 15px; background-color: #ffffff; border-radius: 50%; padding: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
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
          <img src="https://res.cloudinary.com/dahtmgyee/image/upload/v1770241197/htegpj15jn2peip4ewji.png" alt="CASE Logo" class="logo">
          <h1>CASE</h1>
          <p class="tagline">Capture • Assess • Serve • Evolve</p>
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

/**
 * Generate HTML email template for password change notification
 */
const generatePasswordChangeTemplate = ({ name, timestamp }) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Changed Successfully</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; background-color: #F3F4F6; }
        .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 30px 20px; text-align: center; }
        .logo { width: 80px; height: 80px; margin-bottom: 15px; background-color: #ffffff; border-radius: 50%; padding: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header h1 { color: #ffffff; font-size: 28px; font-weight: 700; margin-bottom: 5px; }
        .tagline { color: #D1FAE5; font-size: 14px; letter-spacing: 2px; font-weight: 500; }
        .content { padding: 30px 20px; }
        .success-badge { background-color: #D1FAE5; border-left: 4px solid #10B981; padding: 15px; border-radius: 8px; margin-bottom: 25px; text-align: center; }
        .success-badge .icon { font-size: 48px; margin-bottom: 10px; }
        .success-badge p { color: #065F46; font-size: 18px; font-weight: 600; }
        .info-box { background-color: #F9FAFB; border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid #E5E7EB; }
        .info-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #E5E7EB; }
        .info-row:last-child { border-bottom: none; }
        .info-label { color: #6B7280; font-size: 14px; font-weight: 500; }
        .info-value { color: #111827; font-size: 14px; font-weight: 600; }
        .security-notice { background-color: #FEF3C7; border: 1px solid #FCD34D; border-radius: 8px; padding: 15px; margin: 20px 0; }
        .security-notice p { color: #92400E; font-size: 14px; line-height: 1.5; }
        .tips-box { background-color: #EFF6FF; border-left: 4px solid #3B82F6; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .tips-box h3 { color: #1E40AF; font-size: 16px; font-weight: 600; margin-bottom: 10px; }
        .tips-box ul { list-style: none; padding-left: 0; }
        .tips-box li { color: #1E40AF; font-size: 14px; padding: 5px 0; padding-left: 20px; position: relative; }
        .tips-box li:before { content: "✓"; position: absolute; left: 0; color: #10B981; font-weight: bold; }
        .footer { background-color: #F9FAFB; padding: 20px; text-align: center; color: #6B7280; font-size: 13px; border-top: 1px solid #E5E7EB; }
        .brand { color: #7C3AED; font-weight: 700; }
      </style>
    </head>
    <body>
      <div class="email-container">
        <!-- Header -->
        <div class="header">
          <img src="https://res.cloudinary.com/dtgjbojuh/image/upload/v1738758663/logo_rqgv34.png" alt="CASE Logo" class="logo">
          <h1>CASE</h1>
          <p class="tagline">Capture • Assess • Serve • Evolve</p>
        </div>

        <!-- Content -->
        <div class="content">
          <!-- Success Badge -->
          <div class="success-badge">
            <div class="icon">🔐✓</div>
            <p>Password Changed Successfully</p>
          </div>

          <!-- Greeting -->
          <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
            Hello <strong>${name}</strong>,
          </p>

          <p style="font-size: 15px; color: #4B5563; margin-bottom: 20px;">
            This email confirms that your password has been successfully changed for your CASE platform account.
          </p>

          <!-- Change Details -->
          <div class="info-box">
            <h3 style="color: #111827; font-size: 16px; font-weight: 600; margin-bottom: 15px;">Change Details</h3>
            <div class="info-row">
              <span class="info-label">Date & Time:</span>
              <span class="info-value">${timestamp}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Platform:</span>
              <span class="info-value">CASE Web Portal</span>
            </div>
            <div class="info-row">
              <span class="info-label">Status:</span>
              <span class="info-value" style="color: #10B981;">✓ Confirmed</span>
            </div>
          </div>

          <!-- Security Notice -->
          <div class="security-notice">
            <p>
              <strong>⚠️ Important Security Notice:</strong><br>
              If you did not make this change, please contact your system administrator immediately and secure your account.
            </p>
          </div>

          <!-- Security Tips -->
          <div class="tips-box">
            <h3>🛡️ Keep Your Account Secure</h3>
            <ul>
              <li>Never share your password with anyone</li>
              <li>Use a unique password not used on other websites</li>
              <li>Log out when using shared or public computers</li>
              <li>Change your password regularly (every 90 days)</li>
              <li>Be cautious of phishing emails</li>
            </ul>
          </div>

          <p style="font-size: 14px; color: #6B7280; margin-top: 25px;">
            If you have any questions or concerns about this password change, please contact your system administrator.
          </p>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p>This is an automated security notification from CASE</p>
          <p>Civic Action & Service Excellence Platform</p>
          <p style="margin-top: 15px;">Powered by <span class="brand">CodingGurus</span></p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Send password change notification email
 * @param {Object} userData - User information { email, name, timestamp }
 * @returns {Promise<Object>} - Result of email send operation
 */
export const sendPasswordChangeNotification = async ({ email, name, timestamp }) => {
  try {
    if (!email) {
      console.warn('[Email Service] No email provided for password change notification');
      return { success: false, error: 'No email provided' };
    }

    if (!process.env.RESEND_API_KEY) {
      console.error('[Email Service] RESEND_API_KEY not configured');
      return { success: false, error: 'Email service not configured' };
    }

    const emailHtml = generatePasswordChangeTemplate({ name, timestamp });

    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'CASE Security <security@codinggurus.in>',
      to: email,
      subject: '🔐 Password Changed - CASE Account Security Alert',
      html: emailHtml,
    });

    console.log(`[Email Service] Password change notification sent to ${email}`);
    return { success: true, messageId: result.id };

  } catch (error) {
    console.error('[Email Service] Failed to send password change notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Generate HTML email template for officer onboarding
 */
const generateOfficerOnboardingTemplate = (officerData, tempPassword, createdByName) => {
  const { name, email, class: officerClass, department, zone, ward_id } = officerData;
  
  const classLabels = {
    class_b: 'Class B - Department Level Officer',
    class_c: 'Class C - Ward Level Officer'
  };

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to CASE Officer Portal</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; background-color: #F3F4F6; }
        .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #2563EB 0%, #7C3AED 100%); padding: 30px 20px; text-align: center; }
        .logo { width: 80px; height: 80px; margin-bottom: 15px; background-color: #ffffff; border-radius: 50%; padding: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header h1 { color: #ffffff; font-size: 28px; font-weight: 700; margin-bottom: 5px; }
        .tagline { color: #E0E7FF; font-size: 14px; letter-spacing: 2px; font-weight: 500; }
        .content { padding: 30px 20px; }
        .welcome-badge { background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: #ffffff; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 25px; }
        .welcome-icon { font-size: 48px; margin-bottom: 10px; }
        .welcome-title { font-size: 24px; font-weight: 700; margin-bottom: 8px; }
        .welcome-message { font-size: 14px; opacity: 0.95; }
        .card { background-color: #F9FAFB; border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid #E5E7EB; }
        .card-title { color: #374151; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
        .card-value { color: #111827; font-size: 16px; font-weight: 500; }
        .credentials-box { background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%); border: 2px solid #3B82F6; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
        .credentials-title { color: #1E40AF; font-size: 16px; font-weight: 700; margin-bottom: 15px; display: flex; align-items: center; }
        .credential-item { background-color: #ffffff; padding: 15px; border-radius: 8px; margin-bottom: 12px; border: 1px solid #BFDBFE; }
        .credential-label { color: #6B7280; font-size: 12px; font-weight: 600; margin-bottom: 5px; }
        .credential-value { color: #111827; font-size: 15px; font-weight: 600; font-family: monospace; background-color: #F3F4F6; padding: 10px; border-radius: 6px; word-break: break-all; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
        .info-item { background-color: #F9FAFB; padding: 15px; border-radius: 8px; border: 1px solid #E5E7EB; }
        .info-label { color: #6B7280; font-size: 12px; font-weight: 600; margin-bottom: 5px; }
        .info-value { color: #111827; font-size: 14px; font-weight: 500; }
        .cta-button { display: block; width: 100%; background: linear-gradient(135deg, #2563EB 0%, #7C3AED 100%); color: #ffffff; text-align: center; padding: 16px 24px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 16px; margin-top: 25px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3); }
        .tips-box { background-color: #FEF3C7; border: 1px solid #FCD34D; border-radius: 8px; padding: 15px; margin: 20px 0; }
        .tips-box h3 { color: #92400E; font-size: 16px; font-weight: 600; margin-bottom: 10px; }
        .tips-box ul { list-style: none; padding-left: 0; }
        .tips-box li { color: #92400E; font-size: 14px; padding: 5px 0; padding-left: 20px; position: relative; }
        .tips-box li:before { content: "⚠️"; position: absolute; left: 0; }
        .footer { background-color: #F9FAFB; padding: 25px 20px; text-align: center; border-top: 1px solid #E5E7EB; }
        .footer p { color: #6B7280; font-size: 12px; margin-bottom: 8px; }
        .footer .brand { color: #2563EB; font-weight: 700; }
        @media only screen and (max-width: 600px) {
          .info-grid { grid-template-columns: 1fr; }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <!-- Header -->
        <div class="header">
          <img src="https://res.cloudinary.com/dtgjbojuh/image/upload/v1738758663/logo_rqgv34.png" alt="CASE Logo" class="logo">
          <h1>CASE</h1>
          <p class="tagline">Capture • Assess • Serve • Evolve</p>
        </div>

        <!-- Content -->
        <div class="content">
          <!-- Welcome Badge -->
          <div class="welcome-badge">
            <div class="welcome-icon">👮🎉</div>
            <div class="welcome-title">Welcome to CASE!</div>
            <div class="welcome-message">Your Officer Account is Ready</div>
          </div>

          <!-- Greeting -->
          <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
            Hello <strong>${name}</strong>,
          </p>

          <p style="font-size: 15px; color: #4B5563; margin-bottom: 25px;">
            Welcome to the <strong>CASE (Civic Action & Service Excellence)</strong> platform! Your officer account has been created by <strong>${createdByName}</strong>. 
            You can now access the officer portal to manage civic infrastructure, validate citizen reports, create work orders, and oversee municipal operations.
          </p>

          <!-- Officer Details -->
          <div class="card">
            <div class="card-title">Your Officer Profile</div>
            <div class="info-grid" style="margin-top: 15px;">
              <div class="info-item">
                <div class="info-label">Officer Class</div>
                <div class="info-value">${classLabels[officerClass] || officerClass}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Department</div>
                <div class="info-value">${department}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Zone</div>
                <div class="info-value">${zone}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Ward</div>
                <div class="info-value">${ward_id}</div>
              </div>
            </div>
          </div>

          <!-- Login Credentials -->
          <div class="credentials-box">
            <div class="credentials-title">
              <span style="margin-right: 10px;">🔑</span>
              Your Login Credentials
            </div>
            
            <div class="credential-item">
              <div class="credential-label">Email / Username</div>
              <div class="credential-value">${email}</div>
            </div>
            
            <div class="credential-item">
              <div class="credential-label">Temporary Password</div>
              <div class="credential-value">${tempPassword}</div>
            </div>

            <p style="color: #1E40AF; font-size: 13px; margin-top: 15px; text-align: center;">
              <strong>⚠️ Important:</strong> You must change this password on your first login
            </p>
          </div>

          <!-- CTA Button -->
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/login" class="cta-button">
            🔐 Login to Officer Portal
          </a>

          <!-- Security Tips -->
          <div class="tips-box">
            <h3>🛡️ Security Guidelines</h3>
            <ul>
              <li>Change your password immediately after first login</li>
              <li>Use a strong, unique password (min 8 characters)</li>
              <li>Never share your credentials with anyone</li>
              <li>Log out when using shared computers</li>
              <li>Report suspicious activity to IT department</li>
            </ul>
          </div>

          <!-- Platform Features -->
          <div class="card">
            <div class="card-title">What You Can Do on CASE</div>
            <ul style="color: #4B5563; font-size: 14px; line-height: 1.8; margin-top: 10px; padding-left: 20px;">
              <li>📋 Review and validate citizen-submitted reports</li>
              <li>🔧 Create and assign work orders to contractors</li>
              <li>👷 Manage contractor assignments and performance</li>
              <li>📊 Monitor infrastructure and civic operations</li>
              <li>📈 View analytics and performance dashboards</li>
              <li>🗺️ Access infrastructure mapping and route optimization</li>
              <li>💰 Track budgets and resource allocation</li>
            </ul>
          </div>

          <p style="font-size: 14px; color: #6B7280; margin-top: 25px;">
            If you have any questions or need assistance, please contact the IT Helpdesk or your supervising officer.
          </p>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p>This is an automated message from CASE</p>
          <p>Civic Action & Service Excellence Platform</p>
          <p style="margin-top: 15px;">Powered by <span class="brand">CodingGurus</span></p>
          <p style="margin-top: 10px; font-size: 11px; color: #9CA3AF;">
            For technical support, contact your system administrator.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Send officer onboarding email with login credentials
 * @param {Object} officerData - Officer information
 * @param {string} tempPassword - Temporary password for first login
 * @param {string} createdByName - Name of the officer who created the account
 * @returns {Promise<Object>} - Result of email send operation
 */
export const sendOfficerOnboardingEmail = async (officerData, tempPassword, createdByName) => {
  try {
    if (!officerData.email) {
      console.warn('[Email Service] No officer email provided');
      return { success: false, error: 'No officer email provided' };
    }

    if (!process.env.RESEND_API_KEY) {
      console.error('[Email Service] RESEND_API_KEY not configured');
      return { success: false, error: 'Email service not configured' };
    }

    const emailHtml = generateOfficerOnboardingTemplate(officerData, tempPassword, createdByName);

    const classLabels = {
      class_b: 'Class B Officer',
      class_c: 'Class C Officer'
    };

    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'CASE <noreply@codinggurus.in>',
      to: officerData.email,
      subject: `🎉 Welcome to CASE - Your ${classLabels[officerData.class] || 'Officer'} Account is Ready`,
      html: emailHtml,
    });

    console.log(`[Email Service] Onboarding email sent to officer ${officerData.email}`);
    return { success: true, messageId: result.id };

  } catch (error) {
    console.error('[Email Service] Failed to send officer onboarding email:', error);
    return { success: false, error: error.message };
  }
};

