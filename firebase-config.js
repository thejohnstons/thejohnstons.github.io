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

// Google Calendar and Google Tasks, for the dashboard and the Family calendar.
// Web client ID from Google Cloud (set up by Nathan, November 2026). It is not a secret.
window.GOOGLE_CALENDAR_CLIENT_ID = "151416826562-c187hrn13immjfqgt569get5g5bbh2c4.apps.googleusercontent.com";

// Optional: each person's starting style, by Google email (lower case).
// Either of you can change your own style any time in the apps ("My style").
// e.g. window.STYLE_BY_EMAIL = { "nathan@gmail.com": "green" };
window.STYLE_BY_EMAIL = {};
