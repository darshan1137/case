'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '@/components/ui';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const navigation = [
  { name: 'Dashboard', href: '/officer/dashboard', icon: '📊' },
  { name: 'Contractors', href: '/officer/contractors', icon: '👷' },
];

export default function AssignWorkPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userData, loading: authLoading } = useAuth();
  const [contractors, setContractors] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    contractor_id: searchParams.get('contractor') || '',
    ticket_id: '',
    description: '',
    priority: 'medium',
    estimated_hours: 2,
    materials_needed: '',
    deadline: '',
    budget: '',
  });

  useEffect(() => {
    if (authLoading) return;
    
    if (!userData || !['class_a', 'class_b'].includes(userData.role)) {
      router.push('/auth/login');
    }
  }, [userData, authLoading, router]);

  useEffect(() => {
    if (!authLoading && userData && ['class_a', 'class_b'].includes(userData.role)) {
      loadContractors();
      loadTickets();
    }
  }, [userData, authLoading]);

  const loadContractors = async () => {
    try {
      const response = await fetch('/api/contractors');
      const result = await response.json();
      if (result.success) {
        const activeContractors = result.data.filter(c => c.status === 'active' && c.verified);
        setContractors(activeContractors);
      }
    } catch (error) {
      console.error('Error loading contractors:', error);
    }
  };

  const loadTickets = async () => {
    try {
      const q = query(
        collection(db, 'tickets'),
        where('status', 'in', ['validated', 'approved'])
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTickets(data);
    } catch (error) {
      console.error('Error loading tickets:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.contractor_id || !formData.ticket_id || !formData.description) {
      alert('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const workOrderData = {
        contractor_id: formData.contractor_id,
        ticket_id: formData.ticket_id,
        description: formData.description,
        priority: formData.priority,
        estimated_hours: parseFloat(formData.estimated_hours),
        materials_needed: formData.materials_needed 
          ? formData.materials_needed.split(',').map(m => m.trim())
          : [],
        deadline: formData.deadline || null,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        status: 'assigned',
        assigned_at: new Date().toISOString(),
        assigned_by: userData.uid,
        created_at: new Date().toISOString(),
      };

      await addDoc(collection(db, 'work_orders'), workOrderData);
      
      alert('Work order assigned successfully!');
      router.push('/officer/contractors');
    } catch (error) {
      console.error('Error assigning work:', error);
      alert('Failed to assign work: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout navigation={navigation} title="Assign Work">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Assign Work Order</CardTitle>
            <p className="text-sm text-gray-600 mt-1">Assign a ticket to a contractor</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contractor Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Contractor *
                </label>
                <select
                  name="contractor_id"
                  value={formData.contractor_id}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select Contractor --</option>
                  {contractors.map((contractor) => (
                    <option key={contractor.id} value={contractor.id}>
                      {contractor.name} - {contractor.company_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ticket Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Ticket *
                </label>
                <select
                  name="ticket_id"
                  value={formData.ticket_id}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select Ticket --</option>
                  {tickets.map((ticket) => (
                    <option key={ticket.id} value={ticket.id}>
                      {ticket.id} - {ticket.issue_type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Work Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Detailed description of the work to be done..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                {/* Estimated Hours */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Hours
                  </label>
                  <Input
                    type="number"
                    name="estimated_hours"
                    value={formData.estimated_hours}
                    onChange={handleChange}
                    min="0.5"
                    step="0.5"
                  />
                </div>

                {/* Budget */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Budget ($)
                  </label>
                  <Input
                    type="number"
                    name="budget"
                    value={formData.budget}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="Optional"
                  />
                </div>

                {/* Deadline */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deadline
                  </label>
                  <Input
                    type="datetime-local"
                    name="deadline"
                    value={formData.deadline}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Materials Needed */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Materials Needed (comma-separated)
                </label>
                <Input
                  type="text"
                  name="materials_needed"
                  value={formData.materials_needed}
                  onChange={handleChange}
                  placeholder="asphalt, gravel, cement"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Assigning...' : 'Assign Work Order'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
