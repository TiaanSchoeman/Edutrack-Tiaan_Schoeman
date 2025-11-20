// ------------------ Firebase imports (keep for auth & user data) ------------------
import { app, auth, db } from "../../firebase.js";

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
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

// ------------------ DOM Elements ------------------
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

const attendanceChartEl = document.getElementById("attendanceChart");
const gradesChartEl = document.getElementById("gradesChart");
const pieChartEl = document.getElementById("pieChart");

// ------------------ Auth state & load user data ------------------
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "../Public/loginpage.html";
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

  loadCharts();
});

// ------------------ Profile edit ------------------
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
    await updateDoc(userRef, { name: newName, email: newEmail, phone: newPhone });

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
        data: { labels: ["Week 1", "Week 2", "Week 3", "Week 4"], datasets: [{ label: "Attendance", data: [90, 85, 95, 92], borderColor: "rgba(75,192,192,1)", fill: false, tension: 0.3 }] },
        options: { responsive: true }
      });
    }

    if (gradesChartEl) {
      new Chart(gradesChartEl, {
        type: "line",
        data: { labels: ["Week 1", "Week 2", "Week 3", "Week 4"], datasets: [{ label: "Grades", data: [78, 82, 88, 91], borderColor: "rgba(255,99,132,1)", fill: false, tension: 0.3 }] },
        options: { responsive: true }
      });
    }

    if (pieChartEl) {
      new Chart(pieChartEl, {
        type: "pie",
        data: { labels: ["Completed", "Pending", "Overdue"], datasets: [{ data: [12, 5, 3], backgroundColor: ["#4caf50","#ff9800","#f44336"] }] },
        options: { responsive: true }
      });
    }
  } catch (err) { console.error("Error initializing charts:", err); }
}

// ------------------ LOCAL UPLOADS USING INDEXEDDB ------------------
let dbLocal;
const request = indexedDB.open("EdutrackUploads", 1);

request.onerror = e => console.error("IndexedDB error:", e);
request.onsuccess = e => { 
  dbLocal = e.target.result; 
  loadFiles();       
  initDownloads();   
};
request.onupgradeneeded = e => {
  dbLocal = e.target.result;
  if (!dbLocal.objectStoreNames.contains("uploads")) {
    const store = dbLocal.createObjectStore("uploads", { keyPath: "id", autoIncrement: true });
    store.createIndex("fileName", "fileName", { unique: false });
    store.createIndex("category", "category", { unique: false });
  }
};

// Upload DOM
const uploadArea = document.getElementById("uploadArea");
const fileInput = document.getElementById("fileInput");
const progressBar = document.getElementById("progressBar");
const progressContainer = document.querySelector(".progress-container");
const uploadMessage = document.getElementById("uploadMessage");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("fileCategory");
const tableBody = document.querySelector("#uploadedTable tbody");

// Event Listeners
uploadArea?.addEventListener("click", () => fileInput.click());
uploadArea?.addEventListener("dragover", e => { e.preventDefault(); uploadArea.classList.add("dragover"); });
uploadArea?.addEventListener("dragleave", () => uploadArea.classList.remove("dragover"));
uploadArea?.addEventListener("drop", e => { e.preventDefault(); uploadArea.classList.remove("dragover"); handleFiles(e.dataTransfer.files); });
fileInput?.addEventListener("change", e => handleFiles(e.target.files));
searchInput?.addEventListener("input", applyFilters);
categoryFilter?.addEventListener("change", applyFilters);

function handleFiles(files) {
  if (!files || files.length === 0) return;
  [...files].forEach(file => saveFile(file));
}

function saveFile(file) {
  const category = categoryFilter?.value !== "All" ? categoryFilter.value : "Unsorted";

  const reader = new FileReader();
  reader.onload = () => {
    const fileData = { fileName: file.name, size: file.size, category, data: reader.result, timestamp: new Date() };
    const tx = dbLocal.transaction("uploads", "readwrite");
    const store = tx.objectStore("uploads");
    store.add(fileData);

    tx.oncomplete = () => { 
      uploadMessage.textContent = "Upload complete!"; 
      progressBar.style.width = "0%"; 
      fileInput.value = ""; 
      loadFiles();       
      initDownloads();   
    };
    tx.onerror = e => { console.error("Error saving file:", e); uploadMessage.textContent = "Upload failed!"; };
  };

  progressContainer.style.display = "block";
  let pct = 0;
  const interval = setInterval(() => { 
    pct += 10; 
    if (pct > 100) pct = 100; 
    progressBar.style.width = pct + "%"; 
    if (pct === 100) clearInterval(interval); 
  }, 50);
  reader.readAsArrayBuffer(file);
}

function loadFiles() {
  if (!dbLocal || !tableBody) return;
  const tx = dbLocal.transaction("uploads", "readonly");
  const store = tx.objectStore("uploads");
  const request = store.getAll();
  request.onsuccess = () => { 
    tableBody.innerHTML = ""; 
    request.result.forEach(file => addFileToTable(file)); 
    applyFilters(); 
  };
}

function addFileToTable(file) {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>${file.fileName}</td>
    <td>${(file.size/1024).toFixed(1)} KB</td>
    <td>${file.category}</td>
    <td>${file.timestamp.toLocaleString()}</td>
    <td>Local User</td>
    <td>
      <button class="download-btn">Download</button>
      <button class="delete-btn">Delete</button>
    </td>
  `;

  tr.querySelector(".download-btn")?.addEventListener("click", () => {
    const blob = new Blob([file.data]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = file.fileName; a.click(); URL.revokeObjectURL(url);
  });

  tr.querySelector(".delete-btn")?.addEventListener("click", () => {
    if (!confirm("Delete this file?")) return;
    const tx = dbLocal.transaction("uploads", "readwrite");
    tx.objectStore("uploads").delete(file.id);
    tx.oncomplete = () => { loadFiles(); initDownloads(); };
  });

  tableBody.appendChild(tr);
}

function applyFilters() {
  const q = (searchInput?.value || "").toLowerCase();
  const cat = categoryFilter?.value || "All";

  [...tableBody.children].forEach(row => {
    const name = (row.children[0].textContent || "").toLowerCase();
    const category = row.children[2].textContent;
    row.style.display = (name.includes(q) && (cat === "All" || category === cat)) ? "" : "none";
  });
}

// ------------------ DOWNLOAD PAGE LOGIC ------------------
const downloadSearch = document.getElementById("downloadSearch");
const downloadsContainer = document.getElementById("downloadsContainer");

function initDownloads() {
  if (!dbLocal || !downloadsContainer) return;

  const tx = dbLocal.transaction("uploads", "readonly");
  const store = tx.objectStore("uploads");
  const request = store.getAll();

  request.onsuccess = () => {
    downloadsContainer.innerHTML = "";

    const categories = {};
    request.result.forEach(file => {
      const cat = file.category || "Unsorted";
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(file);
    });

    for (const cat in categories) {
      const section = document.createElement("section");
      section.className = "download-section";

      const h2 = document.createElement("h2");
      h2.textContent = cat;
      section.appendChild(h2);

      const container = document.createElement("div");
      container.className = "download-container";

      categories[cat].forEach(file => {
        const card = document.createElement("div");
        card.className = "download-card";

        const span = document.createElement("span");
        span.textContent = "📄 " + file.fileName;

        const a = document.createElement("a");
        a.className = "btn";
        a.textContent = "Download";
        a.href = "#";
        a.addEventListener("click", () => {
          const blob = new Blob([file.data]);
          const url = URL.createObjectURL(blob);
          const tmp = document.createElement("a");
          tmp.href = url;
          tmp.download = file.fileName;
          tmp.click();
          URL.revokeObjectURL(url);
        });

        card.appendChild(span);
        card.appendChild(a);
        container.appendChild(card);
      });

      section.appendChild(container);
      downloadsContainer.appendChild(section);
    }
  };
}

downloadSearch?.addEventListener("input", () => {
  const query = downloadSearch.value.toLowerCase();
  const allCards = downloadsContainer.querySelectorAll(".download-card");
  allCards.forEach(card => {
    const text = card.querySelector("span").textContent.toLowerCase();
    card.style.display = text.includes(query) ? "flex" : "none";
  });
});
