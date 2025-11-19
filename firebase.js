import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDL59HFduKP1JnwYcA5grQWBJ7LzOPOiJ0",
  authDomain: "edutrack-tiaan-schoeman.firebaseapp.com",
  projectId: "edutrack-tiaan-schoeman",
  storageBucket: "edutrack-tiaan-schoeman.appspot.com",
  messagingSenderId: "836330284560",
  appId: "1:836330284560:web:f9cef109ccc946148b8c95",
  measurementId: "G-18CP0KK338"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
