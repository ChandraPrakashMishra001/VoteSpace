// =====================================================
// VOTESPACE — Firebase Configuration
// js/firebase-config.js
// =====================================================
// HOW TO SET UP (takes ~3 minutes):
// 1. Go to https://console.firebase.google.com/
// 2. Click "Add project" → give it a name → Create
// 3. On the project dashboard, click the </> (Web) icon
// 4. Register your app (any nickname) → copy the config below
// 5. Go to Build → Firestore Database → Create database
//    → Start in "test mode" → choose a region → Done
// 6. Paste your config values below and save this file
// =====================================================

const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT_ID.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Optional: enable offline caching
db.enablePersistence({ synchronizeTabs: true }).catch(err => {
  if (err.code !== 'failed-precondition' && err.code !== 'unimplemented') {
    console.warn('Firestore persistence error:', err);
  }
});
