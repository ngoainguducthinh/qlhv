// assets/js/admin-users.js

let currentTab = 'student';

document.addEventListener('DOMContentLoaded', () => {
    initDefaultUsers(); // Tạo user mẫu nếu chưa có
    renderUserList();
});

// --- 1. KHỞI TẠO DỮ LIỆU MẪU ---
function initDefaultUsers() {
    if (!localStorage.getItem('users')) {
        const defaultUsers = [
            { id: 1, fullname: "Nguyễn Văn A", username: "nguyenvana", role: "student", status: "active", createdAt: new Date().toISOString() },
            { id: 2, fullname: "Trần Thị B", username: "tranthib", role: "student", status: "active", createdAt: new Date().toISOString() },
            { id: 3, fullname: "Lê Văn Soạn", username: "tw.levansoan", role: "writer", status: "active", createdAt: new Date().toISOString() }
        ];
        localStorage.setItem('users', JSON.stringify(defaultUsers));
    }
}

// --- 2. RENDER DANH SÁCH ---
function switchTab(role) {
    currentTab = role;
    
    // Update Style Tab
    const tabStudent = document.getElementById('tab-student');
    const tabWriter = document.getElementById('tab-writer');
    
    if (role === 'student') {
        tabStudent.className = "px-6 py-4 font-bold text-blue-600 border-b-2 border-blue-600 bg-white transition";
        tabWriter.className = "px-6 py-4 font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition";
    } else {
        tabWriter.className = "px-6 py-4 font-bold text-blue-600 border-b-2 border-blue-600 bg-white transition";
        tabStudent.className = "px-6 py-4 font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition";
    }

    renderUserList();
}

function renderUserList() {
    const tbody = document.getElementById('user-list-body');
    const users = JSON.parse(localStorage.getItem('users') || "[]");
    
    // Lọc theo role hiện tại
    const filteredUsers = users.filter(u => u.role === currentTab);

    if (filteredUsers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-gray-400">Chưa có tài khoản nào.</td></tr>`;
        return;
    }

    let html = '';
    filteredUsers.forEach(user => {
        const defaultPass = user.role === 'student' ? 'student@123' : 'writer@123';
        const statusBadge = user.status === 'active' 
            ? '<span class="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">Hoạt động</span>' 
            : '<span class="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">Đã khóa</span>';
        
        const lockIcon = user.status === 'active' ? 'fa-lock-open' : 'fa-lock';
        const lockAction = user.status === 'active' ? 'Khóa' : 'Mở khóa';

        html += `
            <tr class="hover:bg-gray-50 transition">
                <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                        <div class="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                            ${getInitials(user.fullname)}
                        </div>
                        <span class="font-medium text-gray-800">${user.fullname}</span>
                    </div>
                </td>
                <td class="px-6 py-4 font-mono text-blue-600">${user.username}</td>
                <td class="px-6 py-4 text-gray-500 text-xs">${defaultPass}</td>
                <td class="px-6 py-4">${statusBadge}</td>
                <td class="px-6 py-4 text-right">
                    <button title="Reset Mật khẩu" onclick="resetPass('${user.username}')" class="text-gray-400 hover:text-yellow-500 mx-1"><i class="fa-solid fa-key"></i></button>
                    <button title="${lockAction}" onclick="toggleStatus(${user.id})" class="text-gray-400 hover:text-orange-500 mx-1"><i class="fa-solid ${lockIcon}"></i></button>
                    <button title="Xóa" onclick="deleteUser(${user.id})" class="text-gray-400 hover:text-red-500 mx-1"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

// --- 3. UTILS: XỬ LÝ CHUỖI TIẾNG VIỆT ---
function removeVietnameseTones(str) {
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g,"a"); 
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g,"e"); 
    str = str.replace(/ì|í|ị|ỉ|ĩ/g,"i"); 
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g,"o"); 
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g,"u"); 
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g,"y"); 
    str = str.replace(/đ/g,"d");
    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
    str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
    str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
    str = str.replace(/Đ/g, "D");
    // Some system encode vietnamese combining accent as individual utf-8 characters
    str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ""); // ̀ ́ ̃ ̉ ̣  huyền, sắc, ngã, hỏi, nặng
    str = str.replace(/\u02C6|\u0306|\u031B/g, ""); // ˆ ̆ ̛  Â, Ê, Ă, Ơ, Ư
    // Remove extra spaces
    str = str.replace(/ + /g," ");
    str = str.trim();
    return str;
}

function getInitials(name) {
    const parts = name.split(' ');
    return parts[parts.length - 1].charAt(0).toUpperCase();
}

// --- 4. TẠO USER MỚI (Logic tự động Username) ---

function previewUsername() {
    const fullname = document.getElementById('new-fullname').value;
    const role = document.getElementById('new-role').value;
    
    // Xử lý chuỗi: Bỏ dấu -> chữ thường -> bỏ khoảng trắng
    let cleanName = removeVietnameseTones(fullname).toLowerCase().replace(/\s/g, '');
    
    if (cleanName.length === 0) {
        document.getElementById('preview-username').innerText = "...";
        return;
    }

    // Nếu là Writer thì thêm prefix tw.
    let baseUsername = role === 'writer' ? `tw.${cleanName}` : cleanName;
    
    // Kiểm tra trùng lặp để thêm suffix 01, 02...
    // Lưu ý: Đây chỉ là preview, khi bấm Tạo sẽ check lại lần nữa để chắc chắn
    document.getElementById('preview-username').innerText = baseUsername;
    document.getElementById('preview-password').innerText = role === 'writer' ? 'writer@123' : 'student@123';
}

function createUser() {
    const fullname = document.getElementById('new-fullname').value;
    const role = document.getElementById('new-role').value;

    if (!fullname) { alert("Vui lòng nhập họ tên!"); return; }

    // 1. Generate Base Username
    let cleanName = removeVietnameseTones(fullname).toLowerCase().replace(/\s/g, '');
    let baseUsername = role === 'writer' ? `tw.${cleanName}` : cleanName;
    let finalUsername = baseUsername;

    // 2. Check trùng lặp trong LocalStorage
    const users = JSON.parse(localStorage.getItem('users') || "[]");
    let count = 1;
    while (users.some(u => u.username === finalUsername)) {
        finalUsername = `${baseUsername}${count < 10 ? '0'+count : count}`;
        count++;
    }

    // 3. Save
    const newUser = {
        id: Date.now(),
        fullname: fullname,
        username: finalUsername,
        role: role,
        status: 'active',
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    alert(`Đã tạo tài khoản thành công!\nUsername: ${finalUsername}\nMật khẩu: ${role === 'writer' ? 'writer@123' : 'student@123'}`);
    
    closeModal();
    // Nếu đang ở tab khác thì switch qua để thấy user mới
    if (currentTab !== role) switchTab(role);
    else renderUserList();
}

// --- 5. CÁC HÀNH ĐỘNG KHÁC ---

function resetPass(username) {
    // Trong thực tế sẽ gọi API, ở đây chỉ alert
    alert(`Đã reset mật khẩu cho [${username}] về mặc định.`);
}

function toggleStatus(id) {
    const users = JSON.parse(localStorage.getItem('users') || "[]");
    const user = users.find(u => u.id === id);
    if (user) {
        user.status = user.status === 'active' ? 'blocked' : 'active';
        localStorage.setItem('users', JSON.stringify(users));
        renderUserList();
    }
}

function deleteUser(id) {
    if (confirm("Cảnh báo: Xóa tài khoản sẽ xóa toàn bộ bài làm và lịch sử điểm của học viên này.\nBạn có chắc chắn không?")) {
        let users = JSON.parse(localStorage.getItem('users') || "[]");
        users = users.filter(u => u.id !== id);
        localStorage.setItem('users', JSON.stringify(users));
        
        // TODO: Xóa thêm ở bảng history nếu cần thiết (Clear Storage như yêu cầu)
        renderUserList();
    }
}

// --- MODAL UTILS ---
function openModal() {
    document.getElementById('user-modal').classList.remove('hidden');
    document.getElementById('user-modal').classList.add('flex');
    document.getElementById('new-fullname').value = '';
    previewUsername();
}

function closeModal() {
    document.getElementById('user-modal').classList.add('hidden');
    document.getElementById('user-modal').classList.remove('flex');
}
