// ---------------- Firebase ----------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBSlzsjq26_yFu7Hi1x6j8R4Yt7uqpARDw",
  authDomain: "alex-photo-board.firebaseapp.com",
  projectId: "alex-photo-board",
  storageBucket: "alex-photo-board.firebasestorage.app",
  messagingSenderId: "1092938868533",
  appId: "1:1092938868533:web:7df0a0832310c2d30d8e7c"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ---------------- Cloudinary ----------------
const cloudName = "dburezmgp"; // your Cloudinary cloud name
const uploadPreset = "unsigned_upload"; // your preset name

// ---------------- Elements ----------------
const uploadBtn = document.getElementById("uploadBtn");
const fileInput = document.getElementById("fileInput");
const msgInput = document.getElementById("msgInput");
const nameInput = document.getElementById("nameInput");
const gallery = document.getElementById("gallery");

// ---------------- Upload to Cloudinary ----------------
async function uploadImage(file) {
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const res = await fetch(url, { method: "POST", body: formData });
  const data = await res.json();
  return data.secure_url; // return uploaded image URL
}

// ---------------- Upload Button Event ----------------
uploadBtn.addEventListener("click", async () => {
  const file = fileInput.files[0];
  const name = nameInput.value.trim() || "Anonymous";
  const msg = msgInput.value.trim();

  if (!file || !msg) {
    alert("Please pick a file and type a message!");
    return;
  }

  try {
    const imageUrl = await uploadImage(file);
    await addDoc(collection(db, "posts"), {
      name: name,
      message: msg,
      imageUrl: imageUrl,
      createdAt: serverTimestamp() // ✅ Add timestamp
    });

    fileInput.value = "";
    msgInput.value = "";
    nameInput.value = "";
    alert("Uploaded!");
    loadGallery();
  } catch (err) {
    console.error("Upload error:", err);
    alert("Something went wrong during upload.");
  }
});

// ---------------- Load Gallery from Firestore ----------------
async function loadGallery() {
  gallery.innerHTML = "";
  const snapshot = await getDocs(collection(db, "posts"));
  snapshot.forEach(doc => {
    const data = doc.data();

    // Create container for each post
    const item = document.createElement("div");
    item.classList.add("item");

    // Image
    const img = document.createElement("img");
    img.src = data.imageUrl;
    img.alt = data.message;

    // Username
    const username = document.createElement("h4");
    username.textContent = data.name || "Anonymous";

    // Message caption
    const caption = document.createElement("p");
    caption.textContent = data.message || "";

    // Timestamp
    const time = document.createElement("p");
    if (data.createdAt && data.createdAt.toDate) {
      const date = data.createdAt.toDate();
      time.textContent = `🕓 Posted on ${date.toLocaleString()}`;
      time.classList.add("time");
    } else {
      time.textContent = "";
    }

    // Combine elements
    item.appendChild(img);
    item.appendChild(username);
    item.appendChild(caption);
    item.appendChild(time);
    gallery.appendChild(item);
  });
}

// ---------------- Initialize ----------------
loadGallery();
