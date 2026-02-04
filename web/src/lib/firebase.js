// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCu-kaVeIGrgldeJpi46MEt8TQd_0HiN8o",
  authDomain: "case-codinggurus.firebaseapp.com",
  projectId: "case-codinggurus",
  storageBucket: "case-codinggurus.firebasestorage.app",
  messagingSenderId: "898556461362",
  appId: "1:898556461362:web:5a7bc8339be1ce22a1972b",
  measurementId: "G-0S3XL2MTJM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
