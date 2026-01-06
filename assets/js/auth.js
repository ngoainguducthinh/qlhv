// assets/js/auth.js

function handleLogin(event) {
    event.preventDefault();

    const usernameInput = document.getElementById('username').value.trim();
    const passwordInput = document.getElementById('password').value.trim();

    // 1. Kiểm tra Admin (Tài khoản cứng)
    if (usernameInput === 'admin' && passwordInput === 'dta@311710') {
        const adminUser = { username: 'admin', fullname: 'Super Admin', role: 'admin' };
        localStorage.setItem('currentUser', JSON.stringify(adminUser));
        window.location.href = '../admin/dashboard.html';
        return;
    }

    // 2. Kiểm tra User trong LocalStorage (Học viên & Writer)
    const users = JSON.parse(localStorage.getItem('users') || "[]");
    const foundUser = users.find(u => u.username === usernameInput);

    if (foundUser) {
        // Kiểm tra trạng thái khóa
        if (foundUser.status === 'blocked') {
            alert('Tài khoản này đã bị khóa. Vui lòng liên hệ Admin.');
            return;
        }

        // Kiểm tra mật khẩu mặc định
        // (Lưu ý: Demo này chưa có tính năng đổi mật khẩu nên dùng pass mặc định)
        let defaultPass = foundUser.role === 'writer' ? 'writer@123' : 'student@123';
        
        // Trong thực tế, user object nên có field 'password' riêng đã hash. 
        // Ở đây ta so sánh với pass mặc định theo yêu cầu đề bài.
        if (passwordInput === defaultPass) {
            localStorage.setItem('currentUser', JSON.stringify(foundUser));
            
            if (foundUser.role === 'student') {
                window.location.href = '../student/dashboard.html';
            } else {
                // Writer dùng chung Dashboard Admin nhưng bị ẩn menu (đã xử lý bên common.js)
                window.location.href = '../admin/dashboard.html';
            }
            return;
        }
    }

    // 3. Fallback cho Demo (nếu chưa có data trong localStorage)
    if (passwordInput === 'student@123' && usernameInput === 'nguyenvana') {
         // Case dự phòng để bạn test nhanh nếu lười tạo user
         const demoUser = { username: 'nguyenvana', fullname: 'Nguyễn Văn A (Demo)', role: 'student' };
         localStorage.setItem('currentUser', JSON.stringify(demoUser));
         window.location.href = '../student/dashboard.html';
         return;
    }

    alert('Tên đăng nhập hoặc mật khẩu không đúng!');
}
