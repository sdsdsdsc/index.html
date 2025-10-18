// === Firebase Setup ===
// Note: keep your existing Firebase config values here
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "alex-photo-board.firebaseapp.com",
  projectId: "alex-photo-board",
  storageBucket: "alex-photo-board.appspot.com",
  messagingSenderId: "YOUR_ID",
  appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// === Helpers ===
function formatTimestamp(ts) {
  // Accepts Firestore Timestamp object (with .seconds or .toDate),
  // JS Date object, ISO string, or undefined.
  try {
    if (!ts) return "Unknown date";
    // Firestore Timestamp (has seconds)
    if (typeof ts === "object" && ts.seconds !== undefined) {
      return new Date(ts.seconds * 1000).toLocaleString();
    }
    // Firestore Timestamp with toDate()
    if (typeof ts === "object" && typeof ts.toDate === "function") {
      return ts.toDate().toLocaleString();
    }
    // JS Date
    if (ts instanceof Date) {
      return ts.toLocaleString();
    }
    // ISO string
    if (typeof ts === "string") {
      const d = new Date(ts);
      if (!isNaN(d)) return d.toLocaleString();
    }
  } catch (err) {
    console.warn("formatTimestamp error:", err);
  }
  return "Unknown date";
}

function safeText(val, fallback = "") {
  if (val === undefined || val === null) return fallback;
  return String(val);
}

// === DOM refs ===
const uploadBtn = document.getElementById("uploadBtn");
const fileInput = document.getElementById("fileInput");
const userName = document.getElementById("userName");
const messageInput = document.getElementById("messageInput");
const gallery = document.getElementById("gallery");

// === Upload Photo ===
uploadBtn?.addEventListener("click", async () => {
  try {
    const file = fileInput.files[0];
    const name = safeText(userName.value, "Anonymous");
    const message = safeText(messageInput.value, "");

    if (!file) return alert("Please select a file!");

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

    fileInput.value = "";
    userName.value = "";
    messageInput.value = "";
    await loadPhotos();
  } catch (err) {
    console.error("Upload error:", err);
    alert("Upload failed — check console for details.");
  }
});

// === Load Photos ===
async function loadPhotos() {
  try {
    if (!gallery) return;
    gallery.innerHTML = "";

    const snap = await getDocs(collection(db, "photos"));
    if (snap.empty) {
      gallery.innerHTML = "<p>No photos yet.</p>";
      return;
    }

    snap.forEach((docSnap) => {
      const data = docSnap.data() || {};
      const imgUrl = data.imageUrl || "";
      const name = safeText(data.name, "Anonymous");
      const message = safeText(data.message, "");
      const dateStr = formatTimestamp(data.timestamp);

      const card = document.createElement("div");
      card.className = "photo-card";
      card.innerHTML = `
        <img src="${imgUrl || 'https://via.placeholder.com/400x250?text=No+Image'}" alt="photo" />
        <p><strong>${name}</strong></p>
        <p>${message}</p>
        <small class="photo-date">${dateStr}</small>
        <button class="like-btn">❤️ ${data.likes || 0}</button>
      `;
      gallery.appendChild(card);
    });
  } catch (err) {
    console.error("loadPhotos error:", err);
    // don't throw further — let the page continue
    gallery.innerHTML = "<p>Error loading gallery. Check console.</p>";
  }
}

// === Load News ===
async function loadNews() {
  try {
    const newsContainer = document.getElementById("newsContainer");
    if (!newsContainer) return;
    newsContainer.innerHTML = "";

    const snap = await getDocs(collection(db, "news"));
    if (snap.empty) {
      newsContainer.innerHTML = "<p>No news yet.</p>";
      return;
    }

    snap.forEach((docSnap) => {
      const data = docSnap.data() || {};
      const title = safeText(data.title, "Untitled");
      const summary = safeText(data.summary, "");
      const img = data.imageUrl || "";
      const dateStr = formatTimestamp(data.timestamp);

      const card = document.createElement("div");
      card.className = "news-card";
      // link to article page using the document id
      card.innerHTML = `
        <img src="${img || 'https://via.placeholder.com/600x300?text=No+Image'}" alt="news" />
        <h3><a href="article.html?id=${docSnap.id}" class="news-link">${title}</a></h3>
        <p>${summary}</p>
        <small>🕒 ${dateStr}</small>
      `;
      newsContainer.appendChild(card);
    });
  } catch (err) {
    console.error("loadNews error:", err);
    const newsContainer = document.getElementById("newsContainer");
    if (newsContainer) newsContainer.innerHTML = "<p>Error loading news. Check console.</p>";
  }
}

// === Kick off loads (non-blocking) ===
loadPhotos().catch(e => console.warn("loadPhotos catch:", e));
loadNews().catch(e => console.warn("loadNews catch:", e));
