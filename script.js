// === Firebase Setup ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-storage.js";

// TODO: replace these with your real keys
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "alex-photo-board.firebaseapp.com",
  projectId: "alex-photo-board",
  storageBucket: "alex-photo-board.appspot.com",
  messagingSenderId: "YOUR_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// === Upload Photo ===
const uploadBtn = document.getElementById("uploadBtn");
const fileInput = document.getElementById("fileInput");
const userName = document.getElementById("userName");
const messageInput = document.getElementById("messageInput");
const gallery = document.getElementById("gallery");

uploadBtn.addEventListener("click", async () => {
  const file = fileInput.files[0];
  const name = userName.value || "Anonymous";
  const message = messageInput.value || "";

  if (!file) return alert("Please select a file");

  const fileRef = ref(storage, `uploads/${Date.now()}-${file.name}`);
  await uploadBytes(fileRef, file);
  const url = await getDownloadURL(fileRef);

  await addDoc(collection(db, "photos"), {
    name,
    message,
    imageUrl: url,
    likes: 0,
    timestamp: new Date()
  });

  userName.value = "";
  messageInput.value = "";
  fileInput.value = "";
  loadPhotos();
});

// === Load Photos ===
async function loadPhotos() {
  gallery.innerHTML = "";
  const querySnapshot = await getDocs(collection(db, "photos"));
  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const card = document.createElement("div");
    card.className = "photo-card";
    card.innerHTML = `
      <img src="${data.imageUrl}" alt="photo" />
      <p><strong>${data.name}</strong></p>
      <p>${data.message}</p>
      <button class="like-btn">❤️ ${data.likes || 0}</button>
      <div class="comment-section">
        <input class="comment-input" placeholder="Add comment..." />
        <button class="comment-btn">Post</button>
      </div>
    `;
    gallery.appendChild(card);
  });
}
loadPhotos();

// === Load News ===
async function loadNews() {
  const newsContainer = document.getElementById("newsContainer");
  newsContainer.innerHTML = "";
  const querySnapshot = await getDocs(collection(db, "news"));
  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const card = document.createElement("div");
    card.className = "news-card";
    card.innerHTML = `
      <img src="${data.imageUrl}" alt="news image" />
      <h3>${data.title}</h3>
      <p>${data.summary}</p>
      <small>🕒 ${new Date(data.timestamp.seconds * 1000).toLocaleString()}</small>
    `;
    newsContainer.appendChild(card);
  });
}
loadNews();
