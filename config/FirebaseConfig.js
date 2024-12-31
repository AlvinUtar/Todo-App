import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { 
  initializeAuth, 
  getReactNativePersistence, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  signOut as firebaseSignOut,
  getAuth
} from "firebase/auth";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, addDoc } from "firebase/firestore";

// Firebase Configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: "todo-app-7de5d.firebaseapp.com",
  projectId: "todo-app-7de5d",
  storageBucket: "todo-app-7de5d.firebasestorage.app",
  messagingSenderId: "350802648065",
  appId: "1:350802648065:web:fe73b3b8655a4a59617400",
};

// Initialize Firebase App (singleton check)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Firebase Auth with AsyncStorage Persistence
export const auth = getApps().length > 0 
  ? getAuth(app) 
  : initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });

// Add Task Function
export const addTask = async (taskData) => {
  try {
    const tasksCollection = collection(db, "DailyTasks");
    const docRef = await addDoc(tasksCollection, {
      ...taskData,
      createdAt: new Date(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding task: ", error);
    throw error;
  }
};

// Login Function
export const login = async (email, password) => {
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
    throw new Error(errorMessage);
  }
};

// Logout Function
export const logout = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Logout error:", error);
    throw new Error('Logout failed. Please try again.');
  }
};

// Sign-Up Function
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

    let errorMessage = 'Account creation failed. Please try again.';
    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = 'Email already in use.';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Invalid email format.';
        break;
      case 'auth/weak-password':
        errorMessage = 'Password should be at least 6 characters.';
        break;
    }

    throw new Error(errorMessage);
  }
};