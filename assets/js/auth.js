// assets/js/auth.js

function handleLogin(event) {
    event.preventDefault(); // Chặn reload form

    const usernameInput = document.getElementById('username').value.trim();
    const passwordInput = document.getElementById('password').value.trim();

    let user = null;

    // 1. Check Admin
    if (usernameInput === 'admin' && passwordInput === 'dta@311710') {
        user = { username: 'admin', fullname: 'Super Admin', role: 'admin' };
    }
    // 2. Check Test Writer (Quy ước: bắt đầu bằng tw.)
    else if (usernameInput.startsWith('tw.') && passwordInput === 'writer@123') {
        user = { username: usernameInput, fullname: 'Writer Demo', role: 'writer' };
    }
    // 3. Check Học viên (Mặc định)
    else if (passwordInput === 'student@123') {
        user = { username: usernameInput, fullname: 'Học viên Demo', role: 'student' };
    }
    else {
        alert('Tên đăng nhập hoặc mật khẩu không đúng!');
        return;
    }

    // Lưu thông tin user vào localStorage
    localStorage.setItem('currentUser', JSON.stringify(user));
    alert(`Xin chào ${user.role}: ${user.username}`);

    // Điều hướng
    if (user.role === 'student') {
        window.location.href = '../student/dashboard.html';
    } else {
        window.location.href = '../admin/dashboard.html';
    }
}
