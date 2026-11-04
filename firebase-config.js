// Firebase settings for the Johnston Family Dashboard (same project as the meal planner).
// These values are not secret passwords; your data is protected by the database rules.
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyBuSTaC6grnkRApHeFHE471qDuNTKYekxg",
  authDomain: "johnston-meal-planner.firebaseapp.com",
  projectId: "johnston-meal-planner",
  storageBucket: "johnston-meal-planner.firebasestorage.app",
  messagingSenderId: "151416826562",
  appId: "1:151416826562:web:a86bfb59f53e6e12f2295b"
};
window.HOUSEHOLD_ID = "johnston";

// Google Calendar (read-only) for "coming up" on the dashboard.
// Paste the Web client ID from Google Cloud between the quotes (setup guide, step 5).
// It looks like 1234567890-abc123.apps.googleusercontent.com. It is not a secret.
// Leave it empty and the dashboard simply says the calendar isn't set up yet.
window.GOOGLE_CALENDAR_CLIENT_ID = "";

// Optional: each person's starting style, by Google email (lower case).
// Either of you can change your own style any time in the apps ("My style").
// e.g. window.STYLE_BY_EMAIL = { "nathan@gmail.com": "green" };
window.STYLE_BY_EMAIL = {};
