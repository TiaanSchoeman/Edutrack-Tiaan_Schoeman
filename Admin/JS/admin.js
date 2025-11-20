// JS/admin.js
// Make sure this file is loaded with: <script type="module" src="JS/admin.js"></script>

// ------------------ Firebase imports ------------------
import { app, auth, db } from "../../firebase.js"; // adjust path if needed

import {
  onAuthStateChanged,
  signOut,
  updateEmail
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  getStorage,
  ref as storageRefFunc,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

import { Chart } from "https://esm.sh/chart.js@4.4.4/auto";

// ------------------ Universal logout ------------------
window.logoutUser = async function () {
  try {
    const confirmLogout = confirm("Are you sure you want to log out?");
    if (!confirmLogout) return;
    await signOut(auth);
    window.location.href = "../Public/loginpage.html";
  } catch (err) {
    alert("Error logging out: " + err.message);
  }
};

// ------------------ Globals ------------------
let currentUserData = {};
let firebaseUser = null;

// ------------------ DOM Elements (defensive) ------------------
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

// Chart elements (may be absent on some pages)
const attendanceChartEl = document.getElementById("attendanceChart");
const gradesChartEl = document.getElementById("gradesChart");
const pieChartEl = document.getElementById("pieChart");

// ------------------ Auth state & load user data ------------------
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    // not signed in -> redirect to login (only if on protected page)
    try {
      window.location.href = "../Public/loginpage.html";
    } catch (e) {
      console.warn("Redirect failed:", e);
    }
    return;
  }

  firebaseUser = user;

  try {
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);
    currentUserData = snap.exists() ? snap.data() : {};

    const displayName = currentUserData.name || user.displayName || user.email || "Student";
    const displayEmail = currentUserData.email || user.email || "";
    const displayPhone = currentUserData.phone || "N/A";
    const displayUsername = (displayEmail && displayEmail.includes("@")) ? displayEmail.split("@")[0] : (user.uid || "user");

    if (fullnameEl) fullnameEl.textContent = displayName;
    if (emailEl) emailEl.textContent = displayEmail;
    if (phoneEl) phoneEl.textContent = displayPhone;
    if (usernameEl) usernameEl.textContent = displayUsername;

    if (topNameEl) topNameEl.textContent = displayName;
    if (headerNameEl) headerNameEl.textContent = displayName;

    if (editFullname) editFullname.value = displayName;
    if (editEmail) editEmail.value = displayEmail;
    if (editPhone) editPhone.value = displayPhone;
  } catch (err) {
    console.error("Error loading user data:", err);
  }

  // load charts if present
  loadCharts();
});

// ------------------ Profile edit functions ------------------
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
    if (!firebaseUser) return alert("No authenticated user.");
    const newName = (editFullname?.value || "").trim();
    const newEmail = (editEmail?.value || "").trim();
    const newPhone = (editPhone?.value || "").trim();

    const userRef = doc(db, "users", firebaseUser.uid);

    await updateDoc(userRef, {
      name: newName,
      email: newEmail,
      phone: newPhone
    });

    if (newEmail && firebaseUser.email && newEmail !== firebaseUser.email) {
      await updateEmail(firebaseUser, newEmail);
    }

    alert("Profile updated successfully!");
    location.reload();
  } catch (err) {
    console.error("saveProfile error:", err);
    alert("Error updating profile: " + err.message);
  }
}

// ------------------ Event listeners for profile edit ------------------
document.addEventListener("DOMContentLoaded", () => {
  if (editBtn) editBtn.addEventListener("click", enterEditMode);
  if (saveBtn) saveBtn.addEventListener("click", saveProfile);
  if (cancelBtn) cancelBtn.addEventListener("click", cancelEditMode);
});

// ------------------ Charts ------------------
function loadCharts() {
  try {
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
        options: { responsive: true }
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
        options: { responsive: true }
      });
    }

    if (pieChartEl) {
      new Chart(pieChartEl, {
        type: "pie",
        data: {
          labels: ["Completed", "Pending", "Overdue"],
          datasets: [{ data: [12, 5, 3] }]
        },
        options: { responsive: true }
      });
    }
  } catch (err) {
    console.error("Error initializing charts:", err);
  }
}

// ------------------ Storage setup ------------------
const storage = getStorage(app);

// ------------------ Upload DOM elements ------------------
const uploadArea = document.getElementById("uploadArea");
const fileInput = document.getElementById("fileInput");
const progressBar = document.getElementById("progressBar");
const progressContainer = document.querySelector(".progress-container");
const uploadMessage = document.getElementById("uploadMessage");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("fileCategory");
const tableBody = document.querySelector("#uploadedTable tbody");

// Defensive helpers
const safeAdd = (el, evt, fn) => { if (el) el.addEventListener(evt, fn); };

// Click to open file picker
safeAdd(uploadArea, "click", () => fileInput && fileInput.click());

// Drag & drop handlers
safeAdd(uploadArea, "dragover", (e) => { e.preventDefault(); uploadArea.classList?.add("dragover"); });
safeAdd(uploadArea, "dragleave", () => uploadArea.classList?.remove("dragover"));
safeAdd(uploadArea, "drop", (e) => {
  e.preventDefault();
  uploadArea.classList?.remove("dragover");
  handleFiles(e.dataTransfer?.files);
});

// Standard selection
safeAdd(fileInput, "change", (e) => handleFiles(e.target.files));

function handleFiles(files) {
  if (!files || files.length === 0) return;
  [...files].forEach(f => uploadFile(f));
}

// ------------------ Upload file to Storage and save metadata to Firestore ------------------
async function uploadFile(file) {
  try {
    const user = auth.currentUser;
    if (!user) return alert("You must be logged in to upload.");

    const chosenCategory = (categoryFilter?.value && categoryFilter.value !== "All") ? categoryFilter.value : "Unsorted";

    const path = `uploads/${user.uid}/${Date.now()}-${file.name}`;
    const sRef = storageRefFunc(storage, path);

    const task = uploadBytesResumable(sRef, file);

    if (progressContainer) progressContainer.style.display = "block";

    task.on("state_changed",
      (snapshot) => {
        const pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (progressBar) progressBar.style.width = pct + "%";
      },
      (err) => {
        console.error("Upload error:", err);
        if (uploadMessage) uploadMessage.textContent = "Upload failed: " + err.message;
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(task.snapshot.ref);

          await addDoc(collection(db, "uploads"), {
            fileName: file.name,
            size: file.size,
            category: chosenCategory,
            downloadURL,
            storagePath: path,
            uid: user.uid,
            uploaderName: user.displayName || user.email || user.uid,
            timestamp: serverTimestamp()
          });

          if (uploadMessage) uploadMessage.textContent = "Upload complete!";
          if (progressBar) progressBar.style.width = "0%";
          if (fileInput) fileInput.value = "";
        } catch (err2) {
          console.error("Post-upload error:", err2);
          if (uploadMessage) uploadMessage.textContent = "Upload succeeded but saving metadata failed: " + err2.message;
        }
      }
    );
  } catch (err) {
    console.error("uploadFile error:", err);
    alert("Upload error: " + err.message);
  }
}

// ------------------ Real-time listener for uploads collection ------------------
const uploadsQuery = query(collection(db, "uploads"), orderBy("timestamp", "desc"));

onSnapshot(uploadsQuery, (snap) => {
  if (!tableBody) return;
  tableBody.innerHTML = "";
  snap.forEach(docSnap => {
    addFileToTable(docSnap.id, docSnap.data());
  });
  applyFilters(); // keep current filters applied
}, (err) => {
  console.error("Realtime listener error:", err);
});

// ------------------ Table row creation ------------------
function addFileToTable(id, data) {
  if (!tableBody) return;

  const tr = document.createElement("tr");

  const dateText = (data.timestamp && data.timestamp.toDate) ? data.timestamp.toDate().toLocaleString() : "Pending";

  // Escape minimal to avoid breaking the table
  const safeName = String(data.fileName || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const safeCategory = String(data.category || "Unsorted").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const safeUploader = String(data.uploaderName || "Unknown").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  tr.innerHTML = `
    <td>${safeName}</td>
    <td>${data.size ? (data.size / 1024).toFixed(1) + " KB" : "-"}</td>
    <td>${safeCategory}</td>
    <td>${dateText}</td>
    <td>${safeUploader}</td>
    <td>
      <button class="download-btn">Download</button>
      <button class="delete-btn">Delete</button>
    </td>
  `;

  // Attach handlers
  const dlBtn = tr.querySelector(".download-btn");
  dlBtn?.addEventListener("click", () => {
    if (data.downloadURL) window.open(data.downloadURL, "_blank");
    else alert("Download URL not ready.");
  });

  const delBtn = tr.querySelector(".delete-btn");
  delBtn?.addEventListener("click", async () => {
    if (!confirm("Are you sure you want to delete this file?")) return;
    try {
      await deleteDoc(doc(db, "uploads", id));
      // delete from storage
      const fileRef = storageRefFunc(storage, data.storagePath);
      await deleteObject(fileRef);
      // Firestore onSnapshot will remove row automatically
    } catch (err) {
      console.error("Delete error:", err);
      alert("Could not delete file: " + err.message);
    }
  });

  tableBody.appendChild(tr);
}

// ------------------ Filters (search + category) ------------------
safeAdd(searchInput, "input", applyFilters);
safeAdd(categoryFilter, "change", applyFilters);

function applyFilters() {
  if (!tableBody) return;
  const q = (searchInput?.value || "").toLowerCase();
  const cat = categoryFilter?.value || "All";

  [...tableBody.children].forEach(row => {
    const name = (row.children[0]?.textContent || "").toLowerCase();
    const category = row.children[2]?.textContent || "";
    const matchName = name.includes(q);
    const matchCategory = (cat === "All") || (category === cat);
    row.style.display = (matchName && matchCategory) ? "" : "none";
  });
}

// ------------------ Debug: show auth changes in console ------------------
onAuthStateChanged(auth, (u) => {
  console.log("Auth change:", u ? (u.email || u.uid) : null);
});
