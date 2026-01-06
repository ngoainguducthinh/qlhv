// 1. Import từ CDN (Bắt buộc dùng link web này thay vì "firebase/app" như mã gốc)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, updateDoc, doc, getDoc, query, where, deleteDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 2. Cấu hình của bạn (Đã điền sẵn thông tin bạn gửi)
const firebaseConfig = {
  apiKey: "AIzaSyDqlV5VsrDVrxSggNTyQZubtMEgfVA2q4g",
  authDomain: "ltdh-33305.firebaseapp.com",
  projectId: "ltdh-33305",
  storageBucket: "ltdh-33305.firebasestorage.app",
  messagingSenderId: "1075365000828",
  appId: "1:1075365000828:web:ad6d5963f7968944f67bf9",
  measurementId: "G-JTTMM80ZJ4"
};

// 3. Khởi tạo App & Database
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 4. Xuất các hàm để các file khác sử dụng
export { db, collection, getDocs, addDoc, updateDoc, doc, getDoc, query, where, deleteDoc, setDoc };
