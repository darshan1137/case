'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Alert } from '@/components/ui';

export default function OfficerTicketDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { userData, loading: authLoading } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignToId, setAssignToId] = useState('');
  const [assignableUsers, setAssignableUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [showResolveModal, setShowResolveModal] = useState(false);

  const ticketId = params.id;

  const isClassA = userData?.class === 'class_a';
  const isClassB = userData?.class === 'class_b';
  const isClassC = userData?.class === 'class_c';

  const navigation = [
    { name: 'Dashboard', href: '/officer/dashboard', icon: '📊' },
    { name: 'Reports', href: '/officer/reports', icon: '📋' },
    { name: 'Tickets', href: '/officer/tickets', icon: '🎫' },
    { name: 'Work Orders', href: '/officer/work-orders', icon: '🔧' },
    { name: 'Contractors', href: '/officer/contractors', icon: '👷' },
    { name: 'Assets', href: '/officer/assets', icon: '🏗️' },
    { name: 'Analytics', href: '/officer/analytics', icon: '📈' },
    ...(isClassB || isClassA ? [
      { name: 'Team', href: '/officer/team', icon: '👥' },
      { name: 'Budgets', href: '/officer/budgets', icon: '💰' },
    ] : []),
    { name: 'Profile', href: '/officer/profile', icon: '👤' },
  ];

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (userData?.role !== 'officer') {
      router.push('/auth/login');
      return;
    }

    loadTicket();
  }, [userData, authLoading, ticketId, router]);

  const loadTicket = async () => {
    setLoading(true);
    try {
      // Fetch the ticket from the API
      const userId = userData.id || userData.uid;
      const officerClass = userData.class || 'class_a';
      const ward = userData.ward_id || userData.ward || '';
      
      // Build query string with ward for class_b and class_c officers
      let queryParams = `userId=${userId}&class=${officerClass}&search=${encodeURIComponent(ticketId)}`;
      if ((officerClass === 'class_b' || officerClass === 'class_c') && ward) {
        queryParams += `&ward=${encodeURIComponent(ward)}`;
      }
      
      const response = await fetch(`/api/tickets?${queryParams}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load ticket');
      }

      const data = await response.json();
      const foundTicket = data.tickets?.find(t => t.ticket_id === ticketId || t.id === ticketId);

      if (!foundTicket) {
        setError('Ticket not found');
        return;
      }

      setTicket(foundTicket);
      if (foundTicket.images && foundTicket.images.length > 0) {
        setSelectedImage(foundTicket.images[0]);
      }
    } catch (err) {
      console.error('Error loading ticket:', err);
      setError(err.message || 'Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      submitted: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      in_progress: 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getSeverityColor = (severity) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800',
      dangerous: 'bg-red-100 text-red-800'
    };
    return colors[severity] || 'bg-gray-100 text-gray-800';
  };

  const canUserUpdateTicket = () => {
    if (!userData || !ticket) return false;
    
    const userId = userData.id || userData.uid;
    const userRole = userData.role;
    const officerClass = userData.class;
    
    // Only officers with class_b or class_c can update tickets
    if (userRole !== 'officer') return false;
    if (officerClass !== 'class_b' && officerClass !== 'class_c') return false;
    
    // class_b can update any ticket
    if (officerClass === 'class_b') return true;
    
    // class_c can only update if assigned to them
    if (officerClass === 'class_c' && ticket.assigned_to === userId) return true;
    
    return false;
  };

  const getAvailableActions = () => {
    if (!canUserUpdateTicket()) return [];
    
    const actions = [];
    const status = ticket?.status || 'pending';
    const isClassB = userData?.class === 'class_b';
    
    // Assign action: only class_b and only when status is pending
    if (isClassB && status === 'pending') {
      actions.push('assign');
    }
    
    // Start action: when status is assigned
    if (status === 'assigned') {
      actions.push('start');
    }
    
    // Resolve action: when status is in_progress
    if (status === 'in_progress') {
      actions.push('resolve');
    }
    
    return actions;
  };

  const loadAssignableUsers = async () => {
    setLoadingUsers(true);
    try {
      // Fetch all users from the API
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Failed to load users');
      
      const data = await response.json();
      
      // Filter for class_c officers and contractors
      const filteredUsers = data.users?.filter(user => 
        (user.role === 'officer' && user.class === 'class_c') ||
        user.role === 'contractor'
      ) || [];
      
      setAssignableUsers(filteredUsers);
    } catch (err) {
      console.error('Error loading users:', err);
      alert('Failed to load assignable users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleOpenAssignModal = () => {
    setShowAssignModal(true);
    loadAssignableUsers();
  };

  const handleAssignTicket = async () => {
    if (!assignToId) {
      alert('Please enter a user ID to assign');
      return;
    }
    
    setActionLoading(true);
    try {
      const userId = userData.id || userData.uid;
      const response = await fetch(`/api/tickets/${ticketId}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assigned_to: assignToId,
          assigned_by: userId,
          user_role: userData.role
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to assign ticket');
      }
      
      const result = await response.json();
      alert(`✓ Ticket assigned successfully to ${assignToId}`);
      setShowAssignModal(false);
      setAssignToId('');
      await loadTicket(); // Reload ticket data
    } catch (err) {
      alert(`Failed to assign ticket: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartWork = async () => {
    if (!confirm('Start work on this ticket?')) return;
    
    setActionLoading(true);
    try {
      const userId = userData.id || userData.uid;
      const response = await fetch(`/api/tickets/${ticketId}/start`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          user_role: userData.role,
          class: userData.class
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start work');
      }
      
      alert('✓ Work started successfully');
      await loadTicket(); // Reload ticket data
    } catch (err) {
      alert(`Failed to start work: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveTicket = async () => {
    setActionLoading(true);
    try {
      const userId = userData.id || userData.uid;
      const response = await fetch(`/api/tickets/${ticketId}/resolve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          user_role: userData.role,
          class: userData.class,
          resolution_notes: resolutionNotes || undefined
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to resolve ticket');
      }
      
      alert('✓ Ticket resolved successfully');
      setShowResolveModal(false);
      setResolutionNotes('');
      await loadTicket(); // Reload ticket data
    } catch (err) {
      alert(`Failed to resolve ticket: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <DashboardLayout navigation={navigation} title="Officer Portal">
        <div className="max-w-2xl mx-auto">
          <div className="mb-4">
            <Link href="/officer/tickets">
              <Button variant="outline">← Back to Tickets</Button>
            </Link>
          </div>
          <Alert variant="danger">
            {error || 'Ticket not found'}
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navigation={navigation} title="Officer Portal">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Link href="/officer/tickets">
            <Button variant="outline" className="mb-4">← Back to Tickets</Button>
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{ticket.title}</h1>
              <p className="text-gray-600 mt-2">{ticket.ticket_id}</p>
            </div>
            <div className="flex gap-2">
              <Badge className={getSeverityColor(ticket.severity_level)}>
                {ticket.severity_level?.toUpperCase() || 'N/A'}
              </Badge>
              <Badge className={getStatusColor(ticket.status)}>
                {ticket.status?.toUpperCase() || 'PENDING'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 flex-wrap">
              {getAvailableActions().includes('assign') && (
                <Button 
                  onClick={handleOpenAssignModal}
                  disabled={actionLoading}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  {actionLoading ? '⏳ Processing...' : '👤 Assign Ticket'}
                </Button>
              )}
              
              {getAvailableActions().includes('start') && (
                <Button 
                  onClick={handleStartWork}
                  disabled={actionLoading}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  {actionLoading ? '⏳ Processing...' : '⚙️ Start Work'}
                </Button>
              )}
              
              {getAvailableActions().includes('resolve') && (
                <Button 
                  onClick={() => setShowResolveModal(true)}
                  disabled={actionLoading}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  {actionLoading ? '⏳ Processing...' : '✓ Mark as Resolved'}
                </Button>
              )}
              
              {getAvailableActions().length === 0 && (
                <p className="text-gray-500 text-sm">
                  {canUserUpdateTicket() 
                    ? 'No actions available for current ticket status'
                    : 'You do not have permission to update this ticket'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Assign Modal */}
        {showAssignModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Assign Ticket</h2>
              <p className="text-gray-600 mb-6">Select a Class C officer or contractor to assign this ticket to:</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign To
                  </label>
                  {loadingUsers ? (
                    <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                      Loading users...
                    </div>
                  ) : (
                    <select
                      value={assignToId}
                      onChange={(e) => setAssignToId(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    >
                      <option value="">Select user...</option>
                      <optgroup label="Class C Officers">
                        {assignableUsers
                          .filter(user => user.role === 'officer')
                          .map(user => (
                            <option key={user.uid || user.id} value={user.uid || user.id}>
                              {user.name} {user.ward_id ? `(Ward: ${user.ward_id})` : ''}
                            </option>
                          ))}
                      </optgroup>
                      <optgroup label="Contractors">
                        {assignableUsers
                          .filter(user => user.role === 'contractor')
                          .map(user => (
                            <option key={user.uid || user.id} value={user.uid || user.id}>
                              {user.name} {user.company_name ? `(${user.company_name})` : ''}
                            </option>
                          ))}
                      </optgroup>
                    </select>
                  )}
                  {assignableUsers.length === 0 && !loadingUsers && (
                    <p className="text-sm text-amber-600 mt-2">
                      ⚠️ No class_c officers or contractors found
                    </p>
                  )}
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowAssignModal(false);
                      setAssignToId('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAssignTicket}
                    disabled={actionLoading || !assignToId}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50"
                  >
                    {actionLoading ? 'Assigning...' : 'Assign'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Resolve Modal */}
        {showResolveModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Mark as Resolved</h2>
              <p className="text-gray-600 mb-6">Add optional notes about the resolution:</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resolution Notes (Optional)
                  </label>
                  <textarea
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Describe how the issue was resolved..."
                    rows="4"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowResolveModal(false);
                      setResolutionNotes('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleResolveTicket}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50"
                  >
                    {actionLoading ? 'Resolving...' : 'Resolve'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Image Gallery */}
        {ticket.images && ticket.images.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Evidence Images</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Main Image Display */}
                {selectedImage && (
                  <div className="rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={selectedImage}
                      alt="Selected ticket image"
                      className="w-full h-auto max-h-96 object-contain cursor-pointer"
                      onClick={() => window.open(selectedImage, '_blank')}
                    />
                  </div>
                )}

                {/* Thumbnail Gallery */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {ticket.images.map((imageUrl, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(imageUrl)}
                      className={`relative flex-shrink-0 w-20 h-20 rounded border-2 overflow-hidden transition-all ${
                        selectedImage === imageUrl
                          ? 'border-blue-500'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <img
                        src={imageUrl}
                        alt={`Thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {ticket.description}
              </p>
            </CardContent>
          </Card>

          {/* Issue Details */}
          <Card>
            <CardHeader>
              <CardTitle>Issue Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Issue Type</p>
                <p className="font-semibold text-gray-900">{ticket.issue_type || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Department</p>
                <p className="font-semibold text-gray-900">{ticket.department || 'N/A'}</p>
              </div>
              {ticket.sub_department && (
                <div>
                  <p className="text-sm text-gray-500">Sub Department</p>
                  <p className="font-semibold text-gray-900">{ticket.sub_department}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">AI Confidence Score</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${(ticket.confidence_score || 0) * 100}%` }}
                    ></div>
                  </div>
                  <p className="font-semibold text-gray-900 w-12 text-right">
                    {Math.round((ticket.confidence_score || 0) * 100)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Analysis */}
        {ticket.reasoning && (
          <Card>
            <CardHeader>
              <CardTitle>AI Analysis & Reasoning</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                {ticket.reasoning}
              </p>
              {ticket.detected && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
                  <span className="text-2xl">✓</span>
                  <p className="text-green-800">Issue detected and verified by AI system</p>
                </div>
              )}
              {ticket.message && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">AI Message:</p>
                  <p className="text-blue-900">{ticket.message}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Reporter Information */}
        <Card>
          <CardHeader>
            <CardTitle>Citizen Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-semibold text-gray-900">{ticket.citizen_name || 'Anonymous'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-semibold text-gray-900">{ticket.citizen_phone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Citizen ID</p>
              <p className="font-semibold text-gray-900 font-mono text-sm">{ticket.citizen_id || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Ward</p>
              <p className="font-semibold text-gray-900">{ticket.ward || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Submitted On</p>
              <p className="font-semibold text-gray-900">{formatDate(ticket.created_at)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Last Updated</p>
              <p className="font-semibold text-gray-900">{formatDate(ticket.updated_at)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Footer Actions */}
        <div className="flex gap-3">
          <Link href="/officer/tickets">
            <Button variant="outline">Back to Tickets</Button>
          </Link>
          <Link href="/officer/reports">
            <Button variant="outline">View All Reports</Button>
          </Link>
          <Button>Create Work Order</Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
