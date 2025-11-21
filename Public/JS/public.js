// ======================
//  IMPORTS
// ======================
import { auth, db } from "../../firebase.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



// ======================
//  REGISTER FUNCTION
// ======================
const registerForm = document.getElementById("registerForm");

if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("regName").value;
    const email = document.getElementById("regEmail").value;
    const phone = document.getElementById("regPhone").value;
    const school = document.getElementById("regSchool").value;
    const password = document.getElementById("regPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    const message = document.getElementById("registerMessage");

    // Validation
    if (password !== confirmPassword) {
      message.textContent = "Passwords do not match!";
      message.style.color = "red";
      return;
    }

    try {
      // Create user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update display name
      await updateProfile(user, { displayName: name });

      // Save extra info to Firestore
      await setDoc(doc(db, "users", user.uid), {
        name,
        email,
        phone,
        school
      });

      // Success message
      message.textContent = "✅ Registered successfully! Redirecting to login…";
      message.style.color = "lightgreen";

      registerForm.reset();

      // Auto redirect
      setTimeout(() => {
        window.location.href = "loginpage.html";
      }, 2000);

    } catch (error) {
      message.textContent = error.message;
      message.style.color = "red";
    }
  });
}




// ======================
//  LOGIN FUNCTION
// ======================
const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    const loginMessage = document.getElementById("loginMessage");
    loginMessage.textContent = "";

    try {
      // Login user
      await signInWithEmailAndPassword(auth, email, password);

      // Success message
      loginMessage.textContent = "✅ Login successful! Redirecting...";
      loginMessage.style.color = "lightgreen";

      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = "../Admin/dashboard.html";
      }, 1500);

    } catch (error) {
      loginMessage.textContent = error.message;
      loginMessage.style.color = "red";
    }
  });
}

export function logoutUser() {
  auth.signOut().then(() => {
    window.location.href = "../loginpage.html";
  });
}
