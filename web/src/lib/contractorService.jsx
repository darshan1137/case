import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from './firebase';

const COLLECTION_NAME = 'users';

export const contractorService = {
  // Get all contractors
  async getAllContractors(options = {}) {
    try {
      const { verified, active, service_type, ward_id, limitCount = 100 } = options;
      
      let constraints = [
        where('role', '==', 'contractor'),
        orderBy('created_at', 'desc'),
        limit(limitCount)
      ];

      if (typeof verified === 'boolean') {
        constraints.push(where('verified', '==', verified));
      }
      if (typeof active === 'boolean') {
        constraints.push(where('active', '==', active));
      }

      const q = query(collection(db, COLLECTION_NAME), ...constraints);
      const querySnapshot = await getDocs(q);
      
      let contractors = [];
      querySnapshot.forEach((doc) => {
        contractors.push({ id: doc.id, ...doc.data() });
      });

      // Filter by service type if specified (array contains)
      if (service_type) {
        contractors = contractors.filter(c => 
          c.service_types && c.service_types.includes(service_type)
        );
      }

      // Filter by ward if specified (array contains)
      if (ward_id) {
        contractors = contractors.filter(c => 
          c.covered_wards && c.covered_wards.includes(ward_id)
        );
      }

      return {
        success: true,
        contractors
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Get contractor by ID
  async getContractorById(contractorId) {
    try {
      const docRef = doc(db, COLLECTION_NAME, contractorId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists() && docSnap.data().role === 'contractor') {
        return {
          success: true,
          contractor: { id: docSnap.id, ...docSnap.data() }
        };
      } else {
        return {
          success: false,
          error: 'Contractor not found'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Verify contractor (by Class B/C officer)
  async verifyContractor(contractorId, officerId, approved, notes = '') {
    try {
      const docRef = doc(db, COLLECTION_NAME, contractorId);
      const timestamp = new Date().toISOString();

      await updateDoc(docRef, {
        verified: approved,
        active: approved,
        verified_by: officerId,
        verified_at: timestamp,
        verification_notes: notes,
        updated_at: timestamp
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Suspend contractor (by Class B officer)
  async suspendContractor(contractorId, officerId, reason) {
    try {
      const docRef = doc(db, COLLECTION_NAME, contractorId);
      const timestamp = new Date().toISOString();

      const contractor = await getDoc(docRef);
      if (!contractor.exists()) {
        return { success: false, error: 'Contractor not found' };
      }

      const suspensionHistory = contractor.data().suspension_history || [];

      await updateDoc(docRef, {
        active: false,
        suspended: true,
        suspended_by: officerId,
        suspended_at: timestamp,
        suspension_reason: reason,
        suspension_history: [
          ...suspensionHistory,
          {
            suspended_by: officerId,
            suspended_at: timestamp,
            reason
          }
        ],
        updated_at: timestamp
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Reactivate contractor
  async reactivateContractor(contractorId, officerId) {
    try {
      const docRef = doc(db, COLLECTION_NAME, contractorId);
      const timestamp = new Date().toISOString();

      await updateDoc(docRef, {
        active: true,
        suspended: false,
        reactivated_by: officerId,
        reactivated_at: timestamp,
        updated_at: timestamp
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Blacklist contractor (by Class A officer only)
  async blacklistContractor(contractorId, officerId, reason) {
    try {
      const docRef = doc(db, COLLECTION_NAME, contractorId);
      const timestamp = new Date().toISOString();

      await updateDoc(docRef, {
        active: false,
        blacklisted: true,
        blacklisted_by: officerId,
        blacklisted_at: timestamp,
        blacklist_reason: reason,
        updated_at: timestamp
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Update contractor rating
  async updateContractorRating(contractorId, newRating, jobId) {
    try {
      const docRef = doc(db, COLLECTION_NAME, contractorId);
      
      const contractor = await getDoc(docRef);
      if (!contractor.exists()) {
        return { success: false, error: 'Contractor not found' };
      }

      const data = contractor.data();
      const totalJobs = (data.completed_jobs || 0) + 1;
      const currentRating = data.rating || 0;
      
      // Calculate new average rating
      const newAvgRating = ((currentRating * data.completed_jobs) + newRating) / totalJobs;

      await updateDoc(docRef, {
        rating: Math.round(newAvgRating * 100) / 100, // Round to 2 decimal places
        completed_jobs: totalJobs,
        total_jobs: (data.total_jobs || 0) + 1,
        updated_at: new Date().toISOString()
      });

      return { success: true, new_rating: newAvgRating };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Get contractors for assignment (based on work order requirements)
  async getContractorsForAssignment(wardId, serviceType) {
    try {
      const result = await this.getAllContractors({
        verified: true,
        active: true,
        service_type: serviceType,
        ward_id: wardId
      });

      if (!result.success) {
        return result;
      }

      // Sort by rating (descending) and active jobs (ascending)
      const sortedContractors = result.contractors.sort((a, b) => {
        // First priority: rating
        if (b.rating !== a.rating) {
          return (b.rating || 0) - (a.rating || 0);
        }
        // Second priority: fewer active jobs
        return (a.active_jobs || 0) - (b.active_jobs || 0);
      });

      return {
        success: true,
        contractors: sortedContractors
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Update contractor's active job count
  async updateActiveJobCount(contractorId, increment = true) {
    try {
      const docRef = doc(db, COLLECTION_NAME, contractorId);
      
      const contractor = await getDoc(docRef);
      if (!contractor.exists()) {
        return { success: false, error: 'Contractor not found' };
      }

      const currentJobs = contractor.data().active_jobs || 0;
      const newCount = increment ? currentJobs + 1 : Math.max(0, currentJobs - 1);

      await updateDoc(docRef, {
        active_jobs: newCount,
        updated_at: new Date().toISOString()
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
};
