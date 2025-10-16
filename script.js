// ---------------- Firebase ----------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// Your Firebase config (replace with yours)
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

const uploadBtn = document.getElementById("uploadBtn");
const fileInput = document.getElementById("fileInput");
const msgInput = document.getElementById("msgInput");
const gallery = document.getElementById("gallery");

// Upload image to Cloudinary
async function uploadImage(file) {
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const res = await fetch(url, { method: "POST", body: formData });
  const data = await res.json();
  return data.secure_url; // return uploaded image URL
}

// Upload button event
uploadBtn.addEventListener("click", async () => {
  const file = fileInput.files[0];
const name = nameInput.value.trim() || "Anonymous";
const msg = msgInput.value.trim();

if (!file || !msg) return alert("Please pick a file and type a message!");

const imageUrl = await uploadImage(file);
await addDoc(collection(db, "posts"), {
  name: name,
  message: msg,
  imageUrl: imageUrl
});

fileInput.value = "";
msgInput.value = "";
nameInput.value = "";
alert("Uploaded!");
loadGallery();
  } catch (err) {
    console.error("Upload error:", err);
    alert("Something went wrong.");
  }
});

// Load gallery from Firestore
async function loadGallery() {
  gallery.innerHTML = "";
  const snapshot = await getDocs(collection(db, "posts"));
 snapshot.forEach(doc => {
  const data = doc.data();

  // Create a container for each post
  const item = document.createElement("div");
  item.classList.add("item");

  // Image element
  const img = document.createElement("img");
  img.src = data.imageUrl;
  img.alt = data.message;

  // Caption (message text)
 const username = document.createElement("h4");
username.textContent = data.name || "Anonymous";

const caption = document.createElement("p");
caption.textContent = data.message || "";

  // Put them together
  item.appendChild(img);
item.appendChild(username);
item.appendChild(caption);
});

}

loadGallery();
