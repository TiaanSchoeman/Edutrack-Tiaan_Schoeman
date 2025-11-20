// JS/admin.js
import { auth, db } from "../../firebase.js";
import { onAuthStateChanged, signOut, updateEmail } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { Chart } from 'https://esm.sh/chart.js@4.4.4/auto';

// ==================== Logout ====================
window.logoutUser = async function () {
  try {
    await signOut(auth);
    window.location.href = "/Public/loginpage.html"; 
  } catch (err) {
    alert("Error logging out: " + err.message);
  }
};
// ==================== Globals ====================
let currentUserData = {};
let firebaseUser = null;
// ==================== DOM Elements ====================
const fullnameEl = document.getElementById("fullname");
const emailEl = document.getElementById("email");
const phoneEl = document.getElementById("phone");
const usernameEl = document.getElementById("username");
const topNameEl = document.getElementById("topStudentName");
const headerNameEl = document.getElementById("studentName");

const profileView = document.getElementById("profileView");
const profileEdit = document.getElementById("profileEdit");

const editFullname = document.getElementById("editFullname");
const editEmail = document.getElementById("editEmail");
const editPhone = document.getElementById("editPhone");

const editBtn = document.querySelector(".edit-btn");
const saveBtn = document.querySelector(".save-btn");
const cancelBtn = document.querySelector(".cancel-btn");

// Charts
const attendanceChartEl = document.getElementById("attendanceChart");
const gradesChartEl = document.getElementById("gradesChart");
const pieChartEl = document.getElementById("pieChart");

// ==================== Load User Data ====================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "../Public/loginpage.html";
    return;
  }

  firebaseUser = user;

  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);
  currentUserData = snap.exists() ? snap.data() : {};

  const displayName = currentUserData.name || user.email || "Student";
  const displayEmail = currentUserData.email || user.email;
  const displayPhone = currentUserData.phone || "N/A";
  const displayUsername = displayEmail.split("@")[0];

  // Populate PROFILE VIEW
  if (fullnameEl) fullnameEl.textContent = displayName;
  if (emailEl) emailEl.textContent = displayEmail;
  if (phoneEl) phoneEl.textContent = displayPhone;
  if (usernameEl) usernameEl.textContent = displayUsername;

  // Populate dashboard / top headers
  if (topNameEl) topNameEl.textContent = displayName;
  if (headerNameEl) headerNameEl.textContent = displayName;

  // Populate EDIT fields
  if (editFullname) editFullname.value = displayName;
  if (editEmail) editEmail.value = displayEmail;
  if (editPhone) editPhone.value = displayPhone;

  // Load charts
  loadCharts();
});

// ==================== Edit Profile Functions ====================
function enterEditMode() {
  if (profileView && profileEdit) {
    profileView.style.display = "none";
    profileEdit.style.display = "block";
  }
}

function cancelEditMode() {
  if (profileView && profileEdit) {
    profileView.style.display = "block";
    profileEdit.style.display = "none";
  }
}

async function saveProfile() {
  try {
    const newName = editFullname.value.trim();
    const newEmail = editEmail.value.trim();
    const newPhone = editPhone.value.trim();

    const userRef = doc(db, "users", firebaseUser.uid);

    await updateDoc(userRef, {
      name: newName,
      email: newEmail,
      phone: newPhone
    });

    if (newEmail !== firebaseUser.email) {
      await updateEmail(firebaseUser, newEmail);
    }

    alert("Profile updated successfully!");
    location.reload();
  } catch (err) {
    alert("Error updating profile: " + err.message);
  }
}

// ==================== Event Listeners ====================
document.addEventListener("DOMContentLoaded", () => {
  if (editBtn) editBtn.addEventListener("click", enterEditMode);
  if (saveBtn) saveBtn.addEventListener("click", saveProfile);
  if (cancelBtn) cancelBtn.addEventListener("click", cancelEditMode);
});

// ==================== Charts ====================
function loadCharts() {
  if (attendanceChartEl) {
    new Chart(attendanceChartEl, {
      type: "line",
      data: {
        labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
        datasets: [{
          label: "Attendance",
          data: [90, 85, 95, 92],
          borderColor: "rgba(75,192,192,1)",
          fill: false,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 2  // Wider for line charts
      }
    });
  }

  if (gradesChartEl) {
    new Chart(gradesChartEl, {
      type: "line",
      data: {
        labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
        datasets: [{
          label: "Grades",
          data: [78, 82, 88, 91],
          borderColor: "rgba(255,99,132,1)",
          fill: false,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 2  // Wider for line charts
      }
    });
  }

  if (pieChartEl) {
    new Chart(pieChartEl, {
      type: "pie",
      data: {
        labels: ["Completed", "Pending", "Overdue"],
        datasets: [{
          data: [12, 5, 3],
          backgroundColor: ["#4caf50", "#ff9800", "#f44336"]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 1  // Square for circular pie
      }
    });
  }
}
