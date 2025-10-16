// script.js
// ---------------- Firebase ----------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// --- Replace with your Firebase config (you already had this) ---
const firebaseConfig = {
  apiKey: "AIzaSyBLSzjsQ26_yFu7H1ix6j8R4tY7uqpARDw",
  authDomain: "alex-photo-board.firebaseapp.com",
  projectId: "alex-photo-board",
  storageBucket: "alex-photo-board.appspot.com",
  messagingSenderId: "1092938868533",
  appId: "1:1092938868533:web:7dfa0a832310c2d30d8e7c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ---------------- Cloudinary ----------------
const cloudName = "dburezmgp";         // your Cloudinary cloud name
const uploadPreset = "unsigned_upload"; // your unsigned preset

// ---------------- DOM elements ----------------
// Make sure your index.html has these exact element IDs
const fileInput = document.getElementById("fileInput");
const messageInput = document.getElementById("messageInput"); // NOTE: use this id
const uploadBtn = document.getElementById("uploadBtn");
const gallery = document.getElementById("gallery");

// ---------------- Helpers ----------------
async function uploadImageToCloudinary(file) {
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const res = await fetch(url, { method: "POST", body: formData });
  const data = await res.json();

  if (!res.ok) {
    // Cloudinary returns errors inside JSON; show them in console for debugging
    console.error("Cloudinary error response:", data);
    throw new Error(data.error?.message || "Cloudinary upload failed");
  }

  console.log("Cloudinary upload success:", data);
  return data.secure_url;
}

// ---------------- Upload flow ----------------
async function handleUpload() {
  const file = fileInput.files[0];
  const message = (messageInput.value || "").trim();

  if (!file || !message) {
    alert("Please choose a file and enter a message.");
    return;
  }

  uploadBtn.disabled = true;
  uploadBtn.textContent = "Uploading...";

  try {
    // 1) Upload image to Cloudinary
    const imageUrl = await uploadImageToCloudinary(file);

    // 2) Save image URL + message + timestamp to Firestore
    const newDoc = await addDoc(collection(db, "posts"), {
      imageUrl,
      message,
      createdAt: serverTimestamp()
    });

    console.log("Saved Firestore doc:", newDoc.id);

    // 3) Clear inputs and refresh gallery
    fileInput.value = "";
    messageInput.value = "";
    await loadPosts(); // show new post immediately
    alert("Upload successful!");
  } catch (err) {
    console.error("Upload flow error:", err);
    alert("Upload failed — check console for details.");
  } finally {
    uploadBtn.disabled = false;
    uploadBtn.textContent = "Upload";
  }
}

// ---------------- Load & render posts ----------------
async function loadPosts() {
  try {
    gallery.innerHTML = ""; // clear

    // order newest first
    const postsRef = collection(db, "posts");
    const q = query(postsRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    // If there are no posts, show a friendly message
    if (snapshot.empty) {
      gallery.innerHTML = "<p style='text-align:center;color:#666'>No posts yet — be the first!</p>";
      return;
    }

    snapshot.forEach((doc) => {
      const data = doc.data();

      const container = document.createElement("div");
      container.className = "post";
      // style lightly (move to CSS if you prefer)
      container.style.width = "300px";
      container.style.margin = "12px";
      container.style.textAlign = "center";

      const img = document.createElement("img");
      img.src = data.imageUrl;
      img.alt = data.message || "Photo";
      img.style.width = "100%";
      img.style.borderRadius = "12px";
      img.style.display = "block";
      img.style.objectFit = "cover";

      const caption = document.createElement("p");
      caption.textContent = data.message || "";
      caption.style.margin = "8px 0 0 0";
      caption.style.fontSize = "15px";
      caption.style.color = "#222";

      container.appendChild(img);
      container.appendChild(caption);
      gallery.appendChild(container);
    });

    // basic gallery layout (flex) — override with your CSS file if you like
    gallery.style.display = "flex";
    gallery.style.flexWrap = "wrap";
    gallery.style.justifyContent = "center";
  } catch (err) {
    console.error("Error loading posts:", err);
    gallery.innerHTML = "<p style='text-align:center;color:#c00'>Failed to load posts.</p>";
  }
}

// ---------------- Init ----------------
window.addEventListener("DOMContentLoaded", () => {
  // wire button
  uploadBtn.addEventListener("click", handleUpload);

  // initial load
  loadPosts().catch(err => console.error("initial load error:", err));
});
