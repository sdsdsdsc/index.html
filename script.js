// ---------------- Firebase ----------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// Firebase config
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
const cloudName = "dburezmgp";
const uploadPreset = "unsigned_upload";

// ---------------- Elements ----------------
const uploadBtn = document.getElementById("uploadBtn");
const fileInput = document.getElementById("fileInput");
const msgInput = document.getElementById("msgInput");
const nameInput = document.getElementById("nameInput");
const gallery = document.getElementById("gallery");

// ---------------- Modal Elements ----------------
const modal = document.getElementById("postModal");
const modalBody = document.getElementById("modalBody");
const closeBtn = document.querySelector(".close");

// ---------------- Upload to Cloudinary ----------------
async function uploadImage(file) {
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  const res = await fetch(url, { method: "POST", body: formData });
  const data = await res.json();
  return data.secure_url;
}

// ---------------- Upload Button ----------------
uploadBtn.addEventListener("click", async () => {
  const file = fileInput.files[0];
  const name = nameInput.value.trim() || "Anonymous";
  const msg = msgInput.value.trim();
  if (!file || !msg) return alert("Please pick a file and type a message!");

  try {
    const imageUrl = await uploadImage(file);
    await addDoc(collection(db, "posts"), {
      name,
      message: msg,
      imageUrl,
      likes: 0,
      createdAt: serverTimestamp()
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

// ---------------- Load Gallery ----------------
async function loadGallery() {
  gallery.innerHTML = "";
  const snapshot = await getDocs(collection(db, "posts"));

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const postId = docSnap.id;

    const item = document.createElement("div");
    item.classList.add("item");

    const img = document.createElement("img");
    img.src = data.imageUrl;
    img.alt = data.message;

    const username = document.createElement("h4");
    username.textContent = data.name || "Anonymous";

    const caption = document.createElement("p");
    caption.textContent = data.message || "";

    const viewBtn = document.createElement("button");
    viewBtn.textContent = "View Details";
    viewBtn.classList.add("view-btn");
    viewBtn.addEventListener("click", () => openModal(postId, data));

    item.appendChild(img);
    item.appendChild(username);
    item.appendChild(caption);
    item.appendChild(viewBtn);
    gallery.appendChild(item);
  }
}

// ---------------- Modal Logic ----------------
async function openModal(postId, data) {
  modal.style.display = "block";
  modalBody.innerHTML = "";

  const img = document.createElement("img");
  img.src = data.imageUrl;

  const name = document.createElement("h3");
  name.textContent = data.name || "Anonymous";

  const msg = document.createElement("p");
  msg.textContent = data.message || "";

  const time = document.createElement("p");
  if (data.createdAt && data.createdAt.toDate) {
    const date = data.createdAt.toDate();
    time.textContent = `🕓 Posted on ${date.toLocaleString()}`;
    time.classList.add("time");
  }

  // ❤️ Like button
  const likeBtn = document.createElement("button");
  likeBtn.textContent = `❤️ ${data.likes || 0}`;
  likeBtn.classList.add("like-btn");
  likeBtn.addEventListener("click", async () => {
    const newLikes = (data.likes || 0) + 1;
    await updateDoc(doc(db, "posts", postId), { likes: newLikes });
    data.likes = newLikes;
    likeBtn.textContent = `❤️ ${newLikes}`;
  });

  // 💬 Comment section
  const commentBox = document.createElement("input");
  commentBox.placeholder = "Add a comment...";
  commentBox.classList.add("comment-box");

  const commentBtn = document.createElement("button");
  commentBtn.textContent = "Post";
  commentBtn.classList.add("comment-btn");

  const commentList = document.createElement("div");
  commentList.classList.add("comment-list");

  const commentsRef = collection(db, "posts", postId, "comments");
  const commentsSnap = await getDocs(commentsRef);
  commentsSnap.forEach(c => {
    const cData = c.data();
    const p = document.createElement("p");
    p.textContent = `${cData.author || "Anonymous"}: ${cData.text}`;
    commentList.appendChild(p);
  });

  commentBtn.addEventListener("click", async () => {
    const text = commentBox.value.trim();
    if (!text) return alert("Type a comment!");
    await addDoc(commentsRef, {
      text,
      author: "Anonymous",
      createdAt: serverTimestamp()
    });
    const p = document.createElement("p");
    p.textContent = `Anonymous: ${text}`;
    commentList.appendChild(p);
    commentBox.value = "";
  });

  modalBody.appendChild(img);
  modalBody.appendChild(name);
  modalBody.appendChild(msg);
  modalBody.appendChild(time);
  modalBody.appendChild(likeBtn);
  modalBody.appendChild(commentBox);
  modalBody.appendChild(commentBtn);
  modalBody.appendChild(commentList);
}

closeBtn.onclick = () => (modal.style.display = "none");
window.onclick = e => {
  if (e.target === modal) modal.style.display = "none";
};

// ---------------- Init ----------------
loadGallery();
