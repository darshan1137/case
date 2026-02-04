import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  deleteUser,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from './firebase';

export const authService = {
  // Create a new user with email and password
  async createUser(email, password) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return {
        success: true,
        user: userCredential.user,
        uid: userCredential.user.uid
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Sign in user
  async signIn(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return {
        success: true,
        user: userCredential.user
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Sign out user
  async signOut() {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Update user password
  async updateUserPassword(newPassword) {
    try {
      const user = auth.currentUser;
      if (user) {
        await updatePassword(user, newPassword);
        return { success: true };
      }
      return {
        success: false,
        error: 'No authenticated user found'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Delete user account
  async deleteUserAccount() {
    try {
      const user = auth.currentUser;
      if (user) {
        await deleteUser(user);
        return { success: true };
      }
      return {
        success: false,
        error: 'No authenticated user found'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Send password reset email
  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Get current user
  getCurrentUser() {
    return auth.currentUser;
  }
};
