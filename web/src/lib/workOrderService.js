import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  setDoc,
  updateDoc, 
  query,
  where,
  orderBy,
  limit,
  startAfter,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import { WORKORDER_STATUS } from './constants/sla';

const COLLECTION_NAME = 'work_orders';

// Generate unique work order ID
const generateWorkOrderId = () => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '-');
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `WO-${dateStr}-${randomStr}`;
};

export const workOrderService = {
  // Create a new work order
  async createWorkOrder(workOrderData) {
    try {
      const workOrderId = generateWorkOrderId();
      const createdAt = new Date().toISOString();

      const workOrder = {
        work_order_id: workOrderId,
        source: workOrderData.source || 'manual', // manual, citizen_report, sensor_alert
        source_id: workOrderData.source_id || null, // report_id or alert_id
        asset_id: workOrderData.asset_id || null,
        
        category: workOrderData.category,
        priority: workOrderData.priority || 'medium',
        description: workOrderData.description || '',
        
        location: workOrderData.location || null,
        ward_id: workOrderData.ward_id,
        department: workOrderData.department,
        
        // Assignment
        assigned_to: null, // contractor_id
        assigned_by: workOrderData.created_by,
        contractor_name: null,
        
        // Status
        status: WORKORDER_STATUS.CREATED.id,
        
        // SLA
        sla_response_hours: workOrderData.sla_response_hours || 24,
        sla_resolution_hours: workOrderData.sla_resolution_hours || 72,
        sla_deadline: workOrderData.sla_deadline || null,
        sla_breached: false,
        
        // Cost tracking
        estimated_cost: workOrderData.estimated_cost || 0,
        actual_cost: null,
        materials_required: workOrderData.materials_required || [],
        materials_used: [],
        equipment_required: workOrderData.equipment_required || [],
        
        // Media
        images: [],
        completion_images: [],
        
        // Timeline
        timeline: [
          {
            status: WORKORDER_STATUS.CREATED.id,
            timestamp: createdAt,
            actor: workOrderData.created_by,
            note: 'Work order created'
          }
        ],
        
        // Verification
        verified_by: null,
        verified_at: null,
        verification_notes: null,
        
        // Metadata
        created_at: createdAt,
        created_by: workOrderData.created_by,
        updated_at: createdAt,
        completed_at: null,
        closed_at: null,
        
        // ETA tracking
        eta: null,
        actual_arrival: null,
      };

      const docRef = doc(db, COLLECTION_NAME, workOrderId);
      await setDoc(docRef, workOrder);

      return {
        success: true,
        work_order: workOrder,
        work_order_id: workOrderId
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Get work order by ID
  async getWorkOrderById(workOrderId) {
    try {
      const docRef = doc(db, COLLECTION_NAME, workOrderId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          success: true,
          work_order: { id: docSnap.id, ...docSnap.data() }
        };
      } else {
        return {
          success: false,
          error: 'Work order not found'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Assign work order to contractor
  async assignWorkOrder(workOrderId, contractorId, contractorName, assignedBy, notes = '') {
    try {
      const docRef = doc(db, COLLECTION_NAME, workOrderId);
      const timestamp = new Date().toISOString();
      
      const workOrder = await getDoc(docRef);
      if (!workOrder.exists()) {
        return { success: false, error: 'Work order not found' };
      }

      const currentTimeline = workOrder.data().timeline || [];
      
      await updateDoc(docRef, {
        assigned_to: contractorId,
        contractor_name: contractorName,
        assigned_by: assignedBy,
        status: WORKORDER_STATUS.ASSIGNED.id,
        updated_at: timestamp,
        timeline: [
          ...currentTimeline,
          {
            status: WORKORDER_STATUS.ASSIGNED.id,
            timestamp,
            actor: assignedBy,
            note: notes || `Assigned to contractor: ${contractorName}`
          }
        ]
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Update work order status (by contractor)
  async updateStatus(workOrderId, newStatus, actor, data = {}) {
    try {
      const docRef = doc(db, COLLECTION_NAME, workOrderId);
      const timestamp = new Date().toISOString();
      
      const workOrder = await getDoc(docRef);
      if (!workOrder.exists()) {
        return { success: false, error: 'Work order not found' };
      }

      const currentTimeline = workOrder.data().timeline || [];
      
      const updateData = {
        status: newStatus,
        updated_at: timestamp,
        timeline: [
          ...currentTimeline,
          {
            status: newStatus,
            timestamp,
            actor,
            note: data.note || `Status updated to ${newStatus}`
          }
        ]
      };

      // Handle specific status updates
      if (newStatus === WORKORDER_STATUS.ACCEPTED.id && data.eta) {
        updateData.eta = data.eta;
      }
      
      if (newStatus === WORKORDER_STATUS.EN_ROUTE.id && data.current_location) {
        updateData.contractor_location = data.current_location;
      }
      
      if (newStatus === WORKORDER_STATUS.ON_SITE.id) {
        updateData.actual_arrival = timestamp;
      }
      
      if (newStatus === WORKORDER_STATUS.DELAYED.id) {
        updateData.delay_reason = data.reason || 'Not specified';
        updateData.new_eta = data.new_eta || null;
      }
      
      if (newStatus === WORKORDER_STATUS.COMPLETED.id) {
        updateData.completed_at = timestamp;
        updateData.actual_cost = data.actual_cost || null;
        updateData.materials_used = data.materials_used || [];
      }

      await updateDoc(docRef, updateData);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Upload proof of work images
  async uploadCompletionImages(workOrderId, images, actor) {
    try {
      const docRef = doc(db, COLLECTION_NAME, workOrderId);
      const timestamp = new Date().toISOString();
      
      const workOrder = await getDoc(docRef);
      if (!workOrder.exists()) {
        return { success: false, error: 'Work order not found' };
      }

      // Upload images
      const imageUrls = [];
      for (let i = 0; i < images.length; i++) {
        const file = images[i];
        const storageRef = ref(storage, `work_orders/${workOrderId}/completion_${i}_${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        imageUrls.push(url);
      }

      const currentImages = workOrder.data().completion_images || [];
      const currentTimeline = workOrder.data().timeline || [];

      await updateDoc(docRef, {
        completion_images: [...currentImages, ...imageUrls],
        updated_at: timestamp,
        timeline: [
          ...currentTimeline,
          {
            status: workOrder.data().status,
            timestamp,
            actor,
            note: `${images.length} completion image(s) uploaded`
          }
        ]
      });

      return { success: true, imageUrls };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Verify completed work (by officer)
  async verifyWorkOrder(workOrderId, officerId, verification) {
    try {
      const docRef = doc(db, COLLECTION_NAME, workOrderId);
      const timestamp = new Date().toISOString();
      
      const workOrder = await getDoc(docRef);
      if (!workOrder.exists()) {
        return { success: false, error: 'Work order not found' };
      }

      const currentTimeline = workOrder.data().timeline || [];
      const newStatus = verification.approved 
        ? WORKORDER_STATUS.VERIFIED.id 
        : WORKORDER_STATUS.REJECTED.id;

      await updateDoc(docRef, {
        status: newStatus,
        verified_by: officerId,
        verified_at: timestamp,
        verification_notes: verification.notes || '',
        updated_at: timestamp,
        timeline: [
          ...currentTimeline,
          {
            status: newStatus,
            timestamp,
            actor: officerId,
            note: verification.approved 
              ? `Work verified and approved${verification.notes ? `: ${verification.notes}` : ''}`
              : `Work rejected: ${verification.reason || 'Quality standards not met'}`
          }
        ]
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Get work orders by contractor
  async getWorkOrdersByContractor(contractorId, options = {}) {
    try {
      const { status, limitCount = 50, lastDoc = null } = options;
      
      let constraints = [
        where('assigned_to', '==', contractorId),
        orderBy('created_at', 'desc'),
        limit(limitCount)
      ];

      if (status) {
        constraints.push(where('status', '==', status));
      }

      let q = query(collection(db, COLLECTION_NAME), ...constraints);

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const querySnapshot = await getDocs(q);
      const workOrders = [];
      let lastDocument = null;

      querySnapshot.forEach((doc) => {
        workOrders.push({ id: doc.id, ...doc.data() });
        lastDocument = doc;
      });

      return {
        success: true,
        work_orders: workOrders,
        lastDocument,
        hasMore: querySnapshot.size === limitCount
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Get work orders by ward
  async getWorkOrdersByWard(wardId, options = {}) {
    try {
      const { status, priority, limitCount = 50, lastDoc = null } = options;
      
      let constraints = [
        where('ward_id', '==', wardId),
        orderBy('created_at', 'desc'),
        limit(limitCount)
      ];

      if (status) {
        constraints.push(where('status', '==', status));
      }
      if (priority) {
        constraints.push(where('priority', '==', priority));
      }

      let q = query(collection(db, COLLECTION_NAME), ...constraints);

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const querySnapshot = await getDocs(q);
      const workOrders = [];
      let lastDocument = null;

      querySnapshot.forEach((doc) => {
        workOrders.push({ id: doc.id, ...doc.data() });
        lastDocument = doc;
      });

      return {
        success: true,
        work_orders: workOrders,
        lastDocument,
        hasMore: querySnapshot.size === limitCount
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Get all work orders (for admin)
  async getAllWorkOrders(options = {}) {
    try {
      const { status, ward_id, department, priority, limitCount = 50, lastDoc = null } = options;
      
      let constraints = [
        orderBy('created_at', 'desc'),
        limit(limitCount)
      ];

      if (status) {
        constraints.unshift(where('status', '==', status));
      }
      if (ward_id) {
        constraints.unshift(where('ward_id', '==', ward_id));
      }
      if (department) {
        constraints.unshift(where('department', '==', department));
      }
      if (priority) {
        constraints.unshift(where('priority', '==', priority));
      }

      let q = query(collection(db, COLLECTION_NAME), ...constraints);

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const querySnapshot = await getDocs(q);
      const workOrders = [];
      let lastDocument = null;

      querySnapshot.forEach((doc) => {
        workOrders.push({ id: doc.id, ...doc.data() });
        lastDocument = doc;
      });

      return {
        success: true,
        work_orders: workOrders,
        lastDocument,
        hasMore: querySnapshot.size === limitCount
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Get work order stats
  async getWorkOrderStats(wardId = null, department = null) {
    try {
      const statuses = Object.values(WORKORDER_STATUS).map(s => s.id);
      const stats = {};

      for (const status of statuses) {
        let constraints = [where('status', '==', status)];
        
        if (wardId) {
          constraints.push(where('ward_id', '==', wardId));
        }
        if (department) {
          constraints.push(where('department', '==', department));
        }

        const q = query(collection(db, COLLECTION_NAME), ...constraints);
        const snapshot = await getDocs(q);
        stats[status] = snapshot.size;
      }

      return {
        success: true,
        stats
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
};
