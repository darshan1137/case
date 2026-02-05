import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';

/**
 * Reusable Work Milestone / Status Timeline Component
 * Displays ticket progression through lifecycle stages with timestamps and metadata
 * 
 * @param {Object} ticket - Ticket object with status, timestamps, and assignment data
 * @param {string} ticket.status - Current ticket status
 * @param {Date|Object} ticket.created_at - Creation timestamp
 * @param {Date|Object} ticket.assigned_at - Assignment timestamp
 * @param {Date|Object} ticket.assigned_by - Officer who assigned the ticket
 * @param {Date|Object} ticket.assigned_to - Contractor assigned to
 * @param {Date|Object} ticket.in_progress_start_at - Work start timestamp
 * @param {Date|Object} ticket.resolved_at - Resolution timestamp
 * @param {Date|Object} ticket.resolved_by - User who resolved the ticket
 */
export default function TicketTimeline({ ticket }) {
  // Format date for Indian locale
  const formatDate = (date) => {
    if (!date) return null;
    
    const dateObj = date?.toDate?.() || new Date(date);
    
    return {
      date: dateObj.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }),
      time: dateObj.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    };
  };

  // Define milestone stages
  const milestones = [
    {
      id: 'pending',
      label: 'Complaint Reported',
      icon: '📝',
      status: 'pending',
      timestamp: ticket.created_at,
      description: 'Citizen submitted the complaint',
      metadata: ticket.citizen_name ? `By: ${ticket.citizen_name}` : null
    },
    {
      id: 'assigned',
      label: 'Assigned to Team',
      icon: '👨‍💼',
      status: 'assigned',
      timestamp: ticket.assigned_at,
      description: 'Ticket assigned to contractor',
      metadata: ticket.assigned_to_name 
        ? `Assigned to: ${ticket.assigned_to_name}` 
        : ticket.assigned_by_name 
          ? `By: ${ticket.assigned_by_name}`
          : null
    },
    {
      id: 'in_progress',
      label: 'Work In Progress',
      icon: '⚙️',
      status: 'in_progress',
      timestamp: ticket.in_progress_start_at,
      description: 'Contractor started working on issue',
      metadata: ticket.in_progress_start_at 
        ? `Work started by contractor`
        : null
    },
    {
      id: 'resolved',
      label: 'Issue Resolved',
      icon: '✅',
      status: 'resolved',
      timestamp: ticket.resolved_at,
      description: 'Work completed successfully',
      metadata: ticket.resolved_by_name 
        ? `Resolved by: ${ticket.resolved_by_name}`
        : ticket.resolved_at 
          ? 'Verified and closed'
          : null
    }
  ];

  // Determine milestone state
  const getMilestoneState = (milestone) => {
    const statusOrder = ['pending', 'assigned', 'in_progress', 'resolved'];
    const currentIndex = statusOrder.indexOf(ticket.status);
    const milestoneIndex = statusOrder.indexOf(milestone.status);

    if (milestoneIndex < currentIndex || (milestoneIndex === currentIndex && milestone.timestamp)) {
      return 'completed';
    } else if (milestoneIndex === currentIndex) {
      return 'active';
    } else {
      return 'upcoming';
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
        <CardTitle className="flex items-center gap-2 text-lg">
          <span className="text-2xl">🚀</span>
          <span>Work Milestone Timeline</span>
        </CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          Track the progress of this complaint from submission to resolution
        </p>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Desktop: Horizontal Timeline */}
        <div className="hidden md:block">
          <div className="relative">
            {/* Progress Line */}
            <div className="absolute top-8 left-0 right-0 h-1 bg-gray-200">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-1000 ease-out"
                style={{
                  width: `${((milestones.findIndex(m => getMilestoneState(m) === 'active') + 0.5) / milestones.length) * 100}%`
                }}
              />
            </div>

            {/* Milestones */}
            <div className="grid grid-cols-4 gap-4 relative z-10">
              {milestones.map((milestone, index) => {
                const state = getMilestoneState(milestone);
                const formatted = formatDate(milestone.timestamp);

                return (
                  <div key={milestone.id} className="flex flex-col items-center">
                    {/* Icon Circle */}
                    <div
                      className={`
                        w-16 h-16 rounded-full flex items-center justify-center text-2xl
                        transition-all duration-500 transform hover:scale-110
                        ${state === 'completed'
                          ? 'bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-lg animate-pulse-slow'
                          : state === 'active'
                          ? 'bg-white border-4 border-blue-500 shadow-xl animate-bounce-slow'
                          : 'bg-gray-100 border-2 border-gray-300 text-gray-400'
                        }
                      `}
                    >
                      {state === 'completed' ? '✓' : milestone.icon}
                    </div>

                    {/* Milestone Label */}
                    <div className="mt-4 text-center">
                      <h4
                        className={`
                          font-semibold text-sm
                          ${state === 'completed' || state === 'active'
                            ? 'text-gray-900'
                            : 'text-gray-400'
                          }
                        `}
                      >
                        {milestone.label}
                      </h4>
                      
                      {/* Timestamp */}
                      {formatted && (
                        <div className="mt-2 text-xs space-y-0.5">
                          <p className="text-gray-700 font-medium">{formatted.date}</p>
                          <p className="text-gray-500">{formatted.time}</p>
                        </div>
                      )}

                      {/* Description */}
                      <p className="text-xs text-gray-500 mt-2 max-w-[150px]">
                        {milestone.description}
                      </p>

                      {/* Metadata */}
                      {milestone.metadata && (
                        <p className="text-xs text-blue-600 font-medium mt-1">
                          {milestone.metadata}
                        </p>
                      )}

                      {/* Status Badge */}
                      {!formatted && state !== 'completed' && (
                        <span
                          className={`
                            inline-block mt-2 px-2 py-1 rounded-full text-xs font-medium
                            ${state === 'active'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-500'
                            }
                          `}
                        >
                          {state === 'active' ? 'In Progress' : 'Pending'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mobile: Vertical Timeline */}
        <div className="block md:hidden space-y-6">
          {milestones.map((milestone, index) => {
            const state = getMilestoneState(milestone);
            const formatted = formatDate(milestone.timestamp);
            const isLast = index === milestones.length - 1;

            return (
              <div key={milestone.id} className="flex gap-4">
                {/* Left: Icon and Line */}
                <div className="flex flex-col items-center">
                  <div
                    className={`
                      w-12 h-12 rounded-full flex items-center justify-center text-xl
                      transition-all duration-500
                      ${state === 'completed'
                        ? 'bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-lg'
                        : state === 'active'
                        ? 'bg-white border-4 border-blue-500 shadow-xl'
                        : 'bg-gray-100 border-2 border-gray-300 text-gray-400'
                      }
                    `}
                  >
                    {state === 'completed' ? '✓' : milestone.icon}
                  </div>
                  {!isLast && (
                    <div
                      className={`
                        w-1 flex-1 min-h-[60px] mt-2
                        ${state === 'completed'
                          ? 'bg-gradient-to-b from-blue-500 to-purple-500'
                          : 'bg-gray-200'
                        }
                      `}
                    />
                  )}
                </div>

                {/* Right: Content */}
                <div className="flex-1 pb-6">
                  <h4
                    className={`
                      font-semibold text-base
                      ${state === 'completed' || state === 'active'
                        ? 'text-gray-900'
                        : 'text-gray-400'
                      }
                    `}
                  >
                    {milestone.label}
                  </h4>

                  {formatted && (
                    <div className="mt-1 text-sm">
                      <p className="text-gray-700 font-medium">
                        {formatted.date} • {formatted.time}
                      </p>
                    </div>
                  )}

                  <p className="text-sm text-gray-600 mt-1">
                    {milestone.description}
                  </p>

                  {milestone.metadata && (
                    <p className="text-sm text-blue-600 font-medium mt-1">
                      {milestone.metadata}
                    </p>
                  )}

                  {!formatted && state !== 'completed' && (
                    <span
                      className={`
                        inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium
                        ${state === 'active'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-500'
                        }
                      `}
                    >
                      {state === 'active' ? 'Current Stage' : 'Upcoming'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-br from-blue-500 to-purple-500"></div>
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border-2 border-blue-500 bg-white"></div>
              <span>In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-300"></div>
              <span>Upcoming</span>
            </div>
          </div>
        </div>
      </CardContent>

      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
    </Card>
  );
}
