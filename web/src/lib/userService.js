import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  setDoc,
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter
} from 'firebase/firestore';
import { db } from './firebase';
import { authService } from './auth';

const COLLECTION_NAME = 'users';

export const userService = {
  // Create a new user (Auth + Firestore)
  async createUser(userData) {
    try {
      const { email, password, ...userInfo } = userData;
      
      // First create Firebase Auth user
      const authResult = await authService.createUser(email, password);
      
      if (!authResult.success) {
        return {
          success: false,
          error: `Authentication failed: ${authResult.error}`
        };
      }

      // Create user document in Firestore with the Auth UID
      const userDoc = {
        name: userInfo.name,
        role: userInfo.role,
        department: userInfo.department,
        ward_id: userInfo.ward_id,
        zone: userInfo.zone,
        phone: userInfo.phone,
        email: email,
        created_at: new Date().toISOString(),
        active: true,
        uid: authResult.uid
      };

      // Add to Firestore collection with custom document ID (using UID)
      const docRef = doc(db, COLLECTION_NAME, authResult.uid);
      await setDoc(docRef, userDoc);

      return {
        success: true,
        user: userDoc,
        uid: authResult.uid
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Get user by UID
  async getUserById(uid) {
    try {
      const docRef = doc(db, COLLECTION_NAME, uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          success: true,
          user: { id: docSnap.id, ...docSnap.data() }
        };
      } else {
        return {
          success: false,
          error: 'User not found'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Get all users with pagination
  async getAllUsers(limitCount = 50, lastDoc = null) {
    try {
      let q = query(
        collection(db, COLLECTION_NAME),
        orderBy('created_at', 'desc'),
        limit(limitCount)
      );

      if (lastDoc) {
        q = query(
          collection(db, COLLECTION_NAME),
          orderBy('created_at', 'desc'),
          startAfter(lastDoc),
          limit(limitCount)
        );
      }

      const querySnapshot = await getDocs(q);
      const users = [];
      let lastDocument = null;

      querySnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() });
        lastDocument = doc;
      });

      return {
        success: true,
        users,
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

  // Get users by role
  async getUsersByRole(role) {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('role', '==', role),
        orderBy('created_at', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const users = [];

      querySnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() });
      });

      return {
        success: true,
        users
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Get users by ward
  async getUsersByWard(wardId) {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('ward_id', '==', wardId),
        orderBy('created_at', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const users = [];

      querySnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() });
      });

      return {
        success: true,
        users
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Update user
  async updateUser(uid, updates) {
    try {
      const docRef = doc(db, COLLECTION_NAME, uid);
      
      // Add updated_at timestamp
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      await updateDoc(docRef, updateData);

      return {
        success: true,
        message: 'User updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Delete user (Firestore only - Auth deletion should be handled separately)
  async deleteUser(uid) {
    try {
      const docRef = doc(db, COLLECTION_NAME, uid);
      await deleteDoc(docRef);

      return {
        success: true,
        message: 'User deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Soft delete user (set active to false)
  async deactivateUser(uid) {
    try {
      const docRef = doc(db, COLLECTION_NAME, uid);
      await updateDoc(docRef, {
        active: false,
        deactivated_at: new Date().toISOString()
      });

      return {
        success: true,
        message: 'User deactivated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Activate user
  async activateUser(uid) {
    try {
      const docRef = doc(db, COLLECTION_NAME, uid);
      await updateDoc(docRef, {
        active: true,
        activated_at: new Date().toISOString()
      });

      return {
        success: true,
        message: 'User activated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Search users by name or email
  async searchUsers(searchTerm) {
    try {
      // Note: Firestore doesn't support full-text search natively
      // This is a basic implementation that searches by exact matches
      // For advanced search, consider using Algolia or similar service
      
      const nameQuery = query(
        collection(db, COLLECTION_NAME),
        where('name', '>=', searchTerm),
        where('name', '<=', searchTerm + '\uf8ff')
      );

      const emailQuery = query(
        collection(db, COLLECTION_NAME),
        where('email', '>=', searchTerm),
        where('email', '<=', searchTerm + '\uf8ff')
      );

      const [nameSnapshot, emailSnapshot] = await Promise.all([
        getDocs(nameQuery),
        getDocs(emailQuery)
      ]);

      const users = new Map();

      nameSnapshot.forEach((doc) => {
        users.set(doc.id, { id: doc.id, ...doc.data() });
      });

      emailSnapshot.forEach((doc) => {
        users.set(doc.id, { id: doc.id, ...doc.data() });
      });

      return {
        success: true,
        users: Array.from(users.values())
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
};
