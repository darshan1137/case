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
  serverTimestamp,
  GeoPoint
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import { REPORT_STATUS, calculateSLADeadline } from './constants/sla';

const COLLECTION_NAME = 'reports';

// Generate unique report ID
const generateReportId = () => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '-');
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `RPT-${dateStr}-${randomStr}`;
};

export const reportService = {
  // Create a new report
  async createReport(reportData, images = []) {
    try {
      const reportId = generateReportId();
      
      // Upload images first
      const imageUrls = [];
      for (let i = 0; i < images.length; i++) {
        const file = images[i];
        const storageRef = ref(storage, `reports/${reportId}/${i}_${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        imageUrls.push(url);
      }

      // Calculate SLA deadlines
      const createdAt = new Date().toISOString();
      const responseDeadline = calculateSLADeadline(
        reportData.category, 
        reportData.severity, 
        createdAt, 
        'response'
      );
      const resolutionDeadline = calculateSLADeadline(
        reportData.category, 
        reportData.severity, 
        createdAt, 
        'resolution'
      );

      const report = {
        report_id: reportId,
        user_id: reportData.user_id || null,
        anonymous: reportData.anonymous || false,
        location: {
          lat: reportData.location.lat,
          lng: reportData.location.lng,
          accuracy: reportData.location.accuracy || null,
          address: reportData.location.address || null,
        },
        ward_id: reportData.ward_id || null,
        category: reportData.category,
        ai_category: reportData.ai_category || null,
        ai_confidence: reportData.ai_confidence || null,
        severity: reportData.severity || 'medium',
        description: reportData.description || '',
        images: imageUrls,
        status: REPORT_STATUS.SUBMITTED.id,
        
        // SLA tracking
        sla_response_deadline: responseDeadline.toISOString(),
        sla_resolution_deadline: resolutionDeadline.toISOString(),
        sla_breached: false,
        
        // Timeline
        timeline: [
          {
            status: REPORT_STATUS.SUBMITTED.id,
            timestamp: createdAt,
            actor: 'system',
            note: 'Report submitted'
          }
        ],
        
        // Metadata
        created_at: createdAt,
        updated_at: createdAt,
        work_order_id: null,
        feedback: null,
      };

      const docRef = doc(db, COLLECTION_NAME, reportId);
      await setDoc(docRef, report);

      return {
        success: true,
        report: report,
        report_id: reportId
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Get report by ID
  async getReportById(reportId) {
    try {
      const docRef = doc(db, COLLECTION_NAME, reportId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          success: true,
          report: { id: docSnap.id, ...docSnap.data() }
        };
      } else {
        return {
          success: false,
          error: 'Report not found'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Get reports by user
  async getReportsByUser(userId, options = {}) {
    try {
      const { status, limitCount = 20, lastDoc = null } = options;
      
      let q = query(
        collection(db, COLLECTION_NAME),
        where('user_id', '==', userId),
        orderBy('created_at', 'desc'),
        limit(limitCount)
      );

      if (status) {
        q = query(
          collection(db, COLLECTION_NAME),
          where('user_id', '==', userId),
          where('status', '==', status),
          orderBy('created_at', 'desc'),
          limit(limitCount)
        );
      }

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const querySnapshot = await getDocs(q);
      const reports = [];
      let lastDocument = null;

      querySnapshot.forEach((doc) => {
        reports.push({ id: doc.id, ...doc.data() });
        lastDocument = doc;
      });

      return {
        success: true,
        reports,
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

  // Get reports by ward (for officers)
  async getReportsByWard(wardId, options = {}) {
    try {
      const { status, category, limitCount = 50, lastDoc = null } = options;
      
      let constraints = [
        where('ward_id', '==', wardId),
        orderBy('created_at', 'desc'),
        limit(limitCount)
      ];

      if (status) {
        constraints.push(where('status', '==', status));
      }
      if (category) {
        constraints.push(where('category', '==', category));
      }

      let q = query(collection(db, COLLECTION_NAME), ...constraints);

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const querySnapshot = await getDocs(q);
      const reports = [];
      let lastDocument = null;

      querySnapshot.forEach((doc) => {
        reports.push({ id: doc.id, ...doc.data() });
        lastDocument = doc;
      });

      return {
        success: true,
        reports,
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

  // Get all reports (for admin)
  async getAllReports(options = {}) {
    try {
      const { status, category, ward_id, limitCount = 50, lastDoc = null } = options;
      
      let constraints = [
        orderBy('created_at', 'desc'),
        limit(limitCount)
      ];

      if (status) {
        constraints.unshift(where('status', '==', status));
      }
      if (category) {
        constraints.unshift(where('category', '==', category));
      }
      if (ward_id) {
        constraints.unshift(where('ward_id', '==', ward_id));
      }

      let q = query(collection(db, COLLECTION_NAME), ...constraints);

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const querySnapshot = await getDocs(q);
      const reports = [];
      let lastDocument = null;

      querySnapshot.forEach((doc) => {
        reports.push({ id: doc.id, ...doc.data() });
        lastDocument = doc;
      });

      return {
        success: true,
        reports,
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

  // Update report status
  async updateReportStatus(reportId, newStatus, actor, note = '') {
    try {
      const docRef = doc(db, COLLECTION_NAME, reportId);
      const timestamp = new Date().toISOString();
      
      const report = await getDoc(docRef);
      if (!report.exists()) {
        return { success: false, error: 'Report not found' };
      }

      const currentTimeline = report.data().timeline || [];
      
      await updateDoc(docRef, {
        status: newStatus,
        updated_at: timestamp,
        timeline: [
          ...currentTimeline,
          {
            status: newStatus,
            timestamp,
            actor,
            note
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

  // Validate report (by officer)
  async validateReport(reportId, officerId, validation) {
    try {
      const docRef = doc(db, COLLECTION_NAME, reportId);
      const timestamp = new Date().toISOString();
      
      const report = await getDoc(docRef);
      if (!report.exists()) {
        return { success: false, error: 'Report not found' };
      }

      const currentTimeline = report.data().timeline || [];
      const newStatus = validation.accepted ? REPORT_STATUS.ACCEPTED.id : REPORT_STATUS.REJECTED.id;
      
      await updateDoc(docRef, {
        status: newStatus,
        validated_by: officerId,
        validated_at: timestamp,
        validation_notes: validation.notes || '',
        category: validation.category || report.data().category,
        severity: validation.severity || report.data().severity,
        updated_at: timestamp,
        timeline: [
          ...currentTimeline,
          {
            status: newStatus,
            timestamp,
            actor: officerId,
            note: validation.accepted 
              ? `Report validated${validation.notes ? `: ${validation.notes}` : ''}`
              : `Report rejected: ${validation.reason || 'No reason provided'}`
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

  // Link work order to report
  async linkWorkOrder(reportId, workOrderId) {
    try {
      const docRef = doc(db, COLLECTION_NAME, reportId);
      const timestamp = new Date().toISOString();
      
      const report = await getDoc(docRef);
      if (!report.exists()) {
        return { success: false, error: 'Report not found' };
      }

      const currentTimeline = report.data().timeline || [];
      
      await updateDoc(docRef, {
        work_order_id: workOrderId,
        status: REPORT_STATUS.ASSIGNED.id,
        updated_at: timestamp,
        timeline: [
          ...currentTimeline,
          {
            status: REPORT_STATUS.ASSIGNED.id,
            timestamp,
            actor: 'system',
            note: `Work order ${workOrderId} created and assigned`
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

  // Submit feedback
  async submitFeedback(reportId, userId, feedback) {
    try {
      const docRef = doc(db, COLLECTION_NAME, reportId);
      const timestamp = new Date().toISOString();
      
      const report = await getDoc(docRef);
      if (!report.exists()) {
        return { success: false, error: 'Report not found' };
      }

      const currentTimeline = report.data().timeline || [];
      
      await updateDoc(docRef, {
        feedback: {
          user_id: userId,
          rating: feedback.rating,
          resolution: feedback.resolution,
          comment: feedback.comment || '',
          submitted_at: timestamp
        },
        status: REPORT_STATUS.CLOSED.id,
        updated_at: timestamp,
        closed_at: timestamp,
        timeline: [
          ...currentTimeline,
          {
            status: REPORT_STATUS.CLOSED.id,
            timestamp,
            actor: userId,
            note: `Citizen feedback submitted: ${feedback.rating}/5 stars - ${feedback.resolution}`
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

  // Get reports count by status (for dashboard)
  async getReportsStats(wardId = null) {
    try {
      const statuses = Object.values(REPORT_STATUS).map(s => s.id);
      const stats = {};

      for (const status of statuses) {
        let q;
        if (wardId) {
          q = query(
            collection(db, COLLECTION_NAME),
            where('ward_id', '==', wardId),
            where('status', '==', status)
          );
        } else {
          q = query(
            collection(db, COLLECTION_NAME),
            where('status', '==', status)
          );
        }
        
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
