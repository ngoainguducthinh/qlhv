// assets/js/auth.js
import { db, collection, query, where, getDocs } from './firebase-init.js';

// Gán vào window để HTML gọi được
window.handleLogin = async function(event) {
    event.preventDefault();

    const usernameInput = document.getElementById('username').value.trim();
    const passwordInput = document.getElementById('password').value.trim();
    const btn = event.target.querySelector('button');
    
    // Hiệu ứng loading
    const originalText = btn.innerText;
    btn.innerText = "Đang kiểm tra...";
    btn.disabled = true;

    try {
        // 1. Check Admin cứng (như yêu cầu)
        if (usernameInput === 'admin' && passwordInput === 'dta@311710') {
            const adminUser = { username: 'admin', fullname: 'Super Admin', role: 'admin' };
            localStorage.setItem('currentUser', JSON.stringify(adminUser));
            window.location.href = '../admin/dashboard.html';
            return;
        }

        // 2. Check User trên Firebase
        const q = query(collection(db, "users"), where("username", "==", usernameInput));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            alert('Tên đăng nhập không tồn tại!');
            btn.innerText = originalText; btn.disabled = false;
            return;
        }

        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();

        if (userData.status === 'blocked') {
            alert('Tài khoản này đã bị khóa!');
            btn.innerText = originalText; btn.disabled = false;
            return;
        }

        // Check password (theo quy ước đề bài)
        let defaultPass = userData.role === 'writer' ? 'writer@123' : 'student@123';
        
        if (passwordInput === defaultPass) {
            // Lưu session vào localStorage để duy trì đăng nhập
            localStorage.setItem('currentUser', JSON.stringify(userData));
            
            if (userData.role === 'student') {
                window.location.href = '../student/dashboard.html';
            } else {
                window.location.href = '../admin/dashboard.html';
            }
        } else {
            alert('Mật khẩu không đúng!');
            btn.innerText = originalText; btn.disabled = false;
        }

    } catch (error) {
        console.error(error);
        alert('Lỗi kết nối: ' + error.message);
        btn.innerText = originalText; btn.disabled = false;
    }
};
