// ---------------- Firebase Setup ----------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// Your Firebase config
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

// ---------------- Cloudinary Setup ----------------
const cloudName = "dburezmgp"; // your Cloudinary cloud name
const uploadPreset = "unsigned_upload"; // your unsigned preset name

// ---------------- DOM References ----------------
const uploadBtn = document.getElementById("uploadBtn");
const fileInput = document.getElementById("fileInput");
const msgInput = document.getElementById("msgInput");
const gallery = document.getElementById("gallery");

// ---------------- Upload to Cloudinary ----------------
async function uploadImage(file) {
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const res = await fetch(url, { method: "POST", body: formData });
  const data = await res.json();

  if (!data.secure_url) throw new Error("Cloudinary upload failed");
  return data.secure_url;
}

// ---------------- Upload + Save to Firebase ----------------
uploadBtn.addEventListener("click", async () => {
  const file = fileInput.files[0];
  const message = msgInput.value.trim();

  if (!file || !message) {
    alert("Please select a file and write a message!");
    return;
  }

  try {
    uploadBtn.disabled = true;
    uploadBtn.textContent = "Uploading...";

    const imageUrl = await uploadImage(file);
    await addDoc(collection(db, "posts"), { imageUrl, message });

    alert("✅ Upload successful!");
    fileInput.value = "";
    msgInput.value = "";
    await loadPosts(); // Refresh posts

  } catch (err) {
    console.error("Upload error:", err);
    alert("❌ Something went wrong. Check console for details.");
  } finally {
    uploadBtn.disabled = false;
    uploadBtn.textContent = "Upload";
  }
});

// ---------------- Load Posts from Firebase ----------------
async function loadPosts() {
  gallery.innerHTML = ""; // Clear previous content

  const snapshot = await getDocs(collection(db, "posts"));
  snapshot.forEach((doc) => {
    const data = doc.data();

    // Create container
    const postDiv = document.createElement("div");
    postDiv.className = "post";
    postDiv.style.display = "inline-block";
    postDiv.style.margin = "15px";
    postDiv.style.textAlign = "center";

    // Create image
    const img = document.createElement("img");
    img.src = data.imageUrl;
    img.alt = data.message || "Photo";
    img.style.width = "250px";
    img.style.borderRadius = "10px";
    img.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";

    // Create message
    const caption = document.createElement("p");
    caption.textContent = data.message || "(No comment)";
    caption.style.fontFamily = "sans-serif";
    caption.style.marginTop = "8px";
    caption.style.fontSize = "14px";
    caption.style.color = "#333";

    // Append to gallery
    postDiv.appendChild(img);
    postDiv.appendChild(caption);
    gallery.appendChild(postDiv);
  });
}

// ---------------- Load Posts on Page Load ----------------
window.addEventListener("load", loadPosts);
