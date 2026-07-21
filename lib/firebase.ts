// =====================================================
// VOTESPACE — Firebase v9 initialization
// lib/firebase.ts
// =====================================================
// Fill in your credentials below OR use a .env.local file:
//   NEXT_PUBLIC_FIREBASE_API_KEY=...
//   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
//   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
//   etc.
// =====================================================

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey:            "AIzaSyC9awHxRToZTf7hl3XOph2Jn0ukiXj7BLA",
  authDomain:        "votespace-818f5.firebaseapp.com",
  projectId:         "votespace-818f5",
  storageBucket:     "votespace-818f5.firebasestorage.app",
  messagingSenderId: "462790337660",
  appId:             "1:462790337660:web:41d8c89634d882f34015f9",
  measurementId:     "G-2YRQX4X5CY",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
