import * as React from 'react';

export function TicketUpdatedEmail({ 
  ticketId, 
  issueType,
  title,
  previousStatus,
  newStatus,
  priority,
  updatedAt,
  notes,
  assignedTo
}) {
  const statusColors = {
    open: '#3B82F6',
    submitted: '#F59E0B',
    validated: '#8B5CF6',
    approved: '#10B981',
    in_progress: '#0EA5E9',
    completed: '#059669',
    rejected: '#EF4444'
  };

  const getStatusIcon = (status) => {
    const icons = {
      open: '🔴',
      submitted: '📋',
      validated: '✅',
      approved: '👍',
      in_progress: '⚙️',
      completed: '✨',
      rejected: '❌'
    };
    return icons[status] || '📌';
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f9fafb', padding: '20px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        
        {/* Top Banner */}
        <div style={{ backgroundColor: '#0F172A', color: '#ffffff', padding: '30px 20px', textAlign: 'center' }}>
          <h1 style={{ margin: '0 0 10px 0', fontSize: '28px', fontWeight: 'bold' }}>
            📢 Ticket Status Updated
          </h1>
          <p style={{ margin: '0', fontSize: '14px', opacity: 0.9 }}>
            Your ticket progress has been updated
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

          {/* Title */}
          <div style={{ marginBottom: '20px' }}>
            <p style={{ margin: '0', fontSize: '16px', fontWeight: '600', color: '#1F2937' }}>
              {title}
            </p>
          </div>

          {/* Status Update */}
          <div style={{ padding: '20px', backgroundColor: '#F0F9FF', borderRadius: '6px', marginBottom: '20px', borderLeft: `4px solid #0EA5E9` }}>
            <p style={{ margin: '0 0 15px 0', fontSize: '12px', color: '#0369A1', textTransform: 'uppercase', fontWeight: 'bold' }}>
              Status Update
            </p>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {/* Previous Status */}
              <div style={{ textAlign: 'center', flex: 1 }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '24px' }}>
                  {getStatusIcon(previousStatus)}
                </p>
                <p style={{ margin: '0', fontSize: '12px', color: '#6B7280' }}>Previous</p>
                <p style={{ margin: '5px 0 0 0', fontSize: '13px', fontWeight: '600', color: '#1F2937' }}>
                  {previousStatus.replace(/_/g, ' ').toUpperCase()}
                </p>
              </div>

              {/* Arrow */}
              <div style={{ flex: 0.5, textAlign: 'center' }}>
                <p style={{ margin: '0', fontSize: '20px' }}>→</p>
              </div>

              {/* New Status */}
              <div style={{ textAlign: 'center', flex: 1 }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '24px' }}>
                  {getStatusIcon(newStatus)}
                </p>
                <p style={{ margin: '0', fontSize: '12px', color: '#0369A1', fontWeight: 'bold' }}>Now</p>
                <p style={{ margin: '5px 0 0 0', fontSize: '13px', fontWeight: '600', color: '#0C4A6E' }}>
                  {newStatus.replace(/_/g, ' ').toUpperCase()}
                </p>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
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
                  backgroundColor: statusColors[priority] || '#3B82F6',
                  marginRight: '8px'
                }}></span>
                <p style={{ margin: '0', fontSize: '14px', fontWeight: '600', color: '#1F2937' }}>
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </p>
              </div>
            </div>
          </div>

          {/* Assigned To */}
          {assignedTo && (
            <div style={{ padding: '12px', backgroundColor: '#F9FAFB', borderRadius: '6px', marginBottom: '20px' }}>
              <p style={{ margin: '0', fontSize: '12px', color: '#6B7280', textTransform: 'uppercase' }}>Assigned To</p>
              <p style={{ margin: '5px 0 0 0', fontSize: '14px', fontWeight: '600', color: '#1F2937' }}>
                👤 {assignedTo}
              </p>
            </div>
          )}

          {/* Notes */}
          {notes && (
            <div style={{ marginBottom: '20px' }}>
              <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#6B7280', textTransform: 'uppercase', fontWeight: 'bold' }}>
                Update Notes
              </p>
              <div style={{ padding: '15px', backgroundColor: '#FEF3C7', borderRadius: '6px', borderLeft: `4px solid #F59E0B` }}>
                <p style={{ margin: '0', fontSize: '14px', color: '#78350F', lineHeight: '1.6' }}>
                  {notes}
                </p>
              </div>
            </div>
          )}

          {/* Timestamp */}
          <div style={{ padding: '15px', backgroundColor: '#F3F4F6', borderRadius: '6px', borderLeft: `4px solid #9CA3AF` }}>
            <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#6B7280', textTransform: 'uppercase' }}>Updated At</p>
            <p style={{ margin: '0', fontSize: '14px', fontWeight: '500', color: '#1F2937' }}>
              {new Date(updatedAt).toLocaleString()}
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
            View Full Details
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
