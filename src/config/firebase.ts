import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, PhoneAuthProvider, signInWithCredential } from 'firebase/auth';

// Firebase configuration - using environment variables
const getFirebaseConfig = () => {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
  const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
  const appId = import.meta.env.VITE_FIREBASE_APP_ID;
  const measurementId = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID;

  if (!apiKey || !authDomain || !projectId) {
    console.warn('Firebase configuration is incomplete. Some features may not work.');
  }

  return {
    apiKey: apiKey || '',
    authDomain: authDomain || '',
    projectId: projectId || '',
    storageBucket: storageBucket || '',
    messagingSenderId: messagingSenderId || '',
    appId: appId || '',
    measurementId: measurementId || '',
  };
};

const firebaseConfig = getFirebaseConfig();

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const setupRecaptcha = (elementId: string = 'recaptcha-container'): RecaptchaVerifier => {
  return new RecaptchaVerifier(auth, elementId, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA solved
    },
  });
};

export const sendOTP = async (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier): Promise<string> => {
  const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
  return confirmationResult.verificationId;
};

export const verifyOTP = async (verificationId: string, otp: string): Promise<string> => {
  const credential = PhoneAuthProvider.credential(verificationId, otp);
  const userCredential = await signInWithCredential(auth, credential);
  const idToken = await userCredential.user.getIdToken();
  return idToken;
};
