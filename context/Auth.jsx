import { auth } from "../config/FirebaseConfig";
import { signInWithEmailAndPassword,createUserWithEmailAndPassword,updateProfile, signOut as firebaseSignOut } from "firebase/auth";

// Login Function
export const login = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    let errorMessage = 'An error occurred during login.';
    
    // Handle specific error codes
    switch (error.code) {
      case 'auth/invalid-email':
        errorMessage = 'The email address is badly formatted.';
        break;
      case 'auth/user-not-found':
        errorMessage = 'No user found with this email address.';
        break;
      case 'auth/wrong-password':
        errorMessage = 'The password is incorrect.';
        break;
      case 'auth/too-many-requests':
        errorMessage = 'Too many login attempts. Try again later.';
        break;
      default:
        errorMessage = 'Login failed. Please try again.';
    }

    console.error("Login error:", errorMessage);
    throw new Error(errorMessage);  // Or handle it at the UI level.
  }
};

export const logout = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Logout error:", error);
    throw new Error('Logout failed. Please try again.');
  }
};

export const signUp = async (email, password, displayName = '') => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update profile with display name if provided
    if (displayName) {
      await updateProfile(user, { displayName });
    }

    return user;
  } catch (error) {
    console.error("Error signing up: ", error);
    throw error;
  }
};
