import { auth, db } from "../../firebase.js";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ===== Registration =====
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

    if (password !== confirmPassword) {
      message.textContent = "Passwords do not match!";
      message.style.color = "red";
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: name });

      await setDoc(doc(db, "users", user.uid), { name, email, phone, school });

      message.textContent = "✅ Registered successfully!";
      message.style.color = "lightgreen";
      registerForm.reset();

    } catch (error) {
      message.textContent = error.message;
      message.style.color = "red";
    }
  });
}


// ===== Login =====
const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    const loginMessage = document.getElementById("loginMessage");
    loginMessage.textContent = "";

    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("✅ Login successful!");
      window.location.href = "../Admin/dashboard.html";

    } catch (error) {
      loginMessage.textContent = error.message;
      loginMessage.style.color = "red";
    }
  });
}
