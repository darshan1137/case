import * as React from 'react';

export function TicketCreatedEmail({ 
  ticketId, 
  issueType, 
  title, 
  description, 
  location,
  priority,
  createdAt 
}) {
  const priorityColors = {
    low: '#3B82F6',
    medium: '#F59E0B',
    high: '#EF4444',
    critical: '#8B0000'
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f9fafb', padding: '20px' }}>
      {/* Header */}
      <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        
        {/* Top Banner */}
        <div style={{ backgroundColor: '#0F172A', color: '#ffffff', padding: '30px 20px', textAlign: 'center' }}>
          <h1 style={{ margin: '0 0 10px 0', fontSize: '28px', fontWeight: 'bold' }}>
            🎟️ Ticket Created Successfully
          </h1>
          <p style={{ margin: '0', fontSize: '14px', opacity: 0.9 }}>
            Your infrastructure issue has been reported
          </p>
        </div>

        {/* Content */}
        <div style={{ padding: '30px 20px' }}>
          
          {/* Ticket Number */}
          <div style={{ backgroundColor: '#F3F4F6', padding: '15px', borderRadius: '6px', marginBottom: '20px', borderLeft: `4px solid #0F172A` }}>
            <p style={{ margin: '0', fontSize: '12px', color: '#6B7280', textTransform: 'uppercase' }}>Ticket ID</p>
            <p style={{ margin: '5px 0 0 0', fontSize: '20px', fontWeight: 'bold', color: '#0F172A' }}>
              {ticketId}
            </p>
          </div>

          {/* Issue Details */}
          <div style={{ marginBottom: '25px' }}>
            <h2 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: 'bold', color: '#1F2937' }}>
              Issue Details
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div style={{ padding: '12px', backgroundColor: '#F9FAFB', borderRadius: '6px' }}>
                <p style={{ margin: '0', fontSize: '12px', color: '#6B7280', textTransform: 'uppercase' }}>Issue Type</p>
                <p style={{ margin: '5px 0 0 0', fontSize: '14px', fontWeight: '600', color: '#1F2937' }}>
                  {issueType.replace(/_/g, ' ').toUpperCase()}
                </p>
              </div>

              <div style={{ padding: '12px', backgroundColor: '#F9FAFB', borderRadius: '6px' }}>
                <p style={{ margin: '0', fontSize: '12px', color: '#6B7280', textTransform: 'uppercase' }}>Priority</p>
                <div style={{ display: 'flex', alignItems: 'center', marginTop: '5px' }}>
                  <span style={{
                    display: 'inline-block',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: priorityColors[priority] || '#3B82F6',
                    marginRight: '8px'
                  }}></span>
                  <p style={{ margin: '0', fontSize: '14px', fontWeight: '600', color: '#1F2937' }}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Title */}
          <div style={{ marginBottom: '15px' }}>
            <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#6B7280', textTransform: 'uppercase' }}>Title</p>
            <p style={{ margin: '0', fontSize: '16px', fontWeight: '600', color: '#1F2937' }}>
              {title}
            </p>
          </div>

          {/* Description */}
          <div style={{ marginBottom: '15px' }}>
            <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#6B7280', textTransform: 'uppercase' }}>Description</p>
            <p style={{ margin: '0', fontSize: '14px', color: '#4B5563', lineHeight: '1.6' }}>
              {description}
            </p>
          </div>

          {/* Location */}
          <div style={{ marginBottom: '25px' }}>
            <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#6B7280', textTransform: 'uppercase' }}>Location</p>
            <p style={{ margin: '0', fontSize: '14px', color: '#1F2937', fontWeight: '500' }}>
              📍 {location}
            </p>
          </div>

          {/* Timeline */}
          <div style={{ padding: '15px', backgroundColor: '#F0F9FF', borderRadius: '6px', borderLeft: `4px solid #0EA5E9` }}>
            <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#0369A1', textTransform: 'uppercase' }}>Created At</p>
            <p style={{ margin: '0', fontSize: '14px', fontWeight: '500', color: '#0C4A6E' }}>
              {new Date(createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <div style={{ padding: '20px', textAlign: 'center', borderTop: '1px solid #E5E7EB' }}>
          <a href="http://localhost:3000" style={{
            display: 'inline-block',
            padding: '12px 30px',
            backgroundColor: '#0F172A',
            color: '#ffffff',
            textDecoration: 'none',
            borderRadius: '6px',
            fontWeight: '600',
            fontSize: '14px'
          }}>
            View Ticket Status
          </a>
        </div>

        {/* Footer */}
        <div style={{ padding: '20px', backgroundColor: '#F3F4F6', borderTop: '1px solid #E5E7EB', textAlign: 'center', fontSize: '12px', color: '#6B7280' }}>
          <p style={{ margin: '0 0 10px 0' }}>
            This is an automated email. Please do not reply to this message.
          </p>
          <p style={{ margin: '0', opacity: 0.8 }}>
            © 2026 City Infrastructure Management System
          </p>
        </div>
      </div>
    </div>
  );
}
