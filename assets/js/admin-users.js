// assets/js/admin-users.js
import { db, collection, getDocs, addDoc, updateDoc, doc, query, where, deleteDoc } from './firebase-init.js';

let currentTab = 'student';

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    window.renderUserList();
});

// --- HELPER: Xử lý tiếng Việt ---
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
    str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ""); 
    str = str.replace(/\u02C6|\u0306|\u031B/g, ""); 
    str = str.replace(/ + /g," ");
    str = str.trim();
    return str;
}

// --- MAIN FUNCTIONS ---

window.switchTab = function(role) {
    currentTab = role;
    const tabStudent = document.getElementById('tab-student');
    const tabWriter = document.getElementById('tab-writer');
    
    if (role === 'student') {
        tabStudent.className = "px-6 py-4 font-bold text-blue-600 border-b-2 border-blue-600 bg-white transition";
        tabWriter.className = "px-6 py-4 font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition";
    } else {
        tabWriter.className = "px-6 py-4 font-bold text-blue-600 border-b-2 border-blue-600 bg-white transition";
        tabStudent.className = "px-6 py-4 font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition";
    }
    window.renderUserList();
}

window.renderUserList = async function() {
    const tbody = document.getElementById('user-list-body');
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4">Đang tải dữ liệu từ Firebase...</td></tr>`;

    try {
        const q = query(collection(db, "users"), where("role", "==", currentTab));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-gray-400">Chưa có tài khoản nào.</td></tr>`;
            return;
        }

        let html = '';
        querySnapshot.forEach((doc) => {
            const user = doc.data();
            const userId = doc.id;
            const defaultPass = user.role === 'student' ? 'student@123' : 'writer@123';
            
            const statusBadge = user.status === 'active' 
                ? '<span class="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">Hoạt động</span>' 
                : '<span class="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">Đã khóa</span>';
            
            const lockIcon = user.status === 'active' ? 'fa-lock-open' : 'fa-lock';

            html += `
                <tr class="hover:bg-gray-50 transition">
                    <td class="px-6 py-4"><span class="font-medium text-gray-800">${user.fullname}</span></td>
                    <td class="px-6 py-4 font-mono text-blue-600">${user.username}</td>
                    <td class="px-6 py-4 text-gray-500 text-xs">${defaultPass}</td>
                    <td class="px-6 py-4">${statusBadge}</td>
                    <td class="px-6 py-4 text-right">
                        <button onclick="toggleStatus('${userId}', '${user.status}')" class="text-gray-400 hover:text-orange-500 mx-1"><i class="fa-solid ${lockIcon}"></i></button>
                        <button onclick="deleteUser('${userId}')" class="text-gray-400 hover:text-red-500 mx-1"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>
            `;
        });
        tbody.innerHTML = html;

    } catch (error) {
        console.error(error);
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-red-500">Lỗi tải dữ liệu: ${error.message}</td></tr>`;
    }
}

window.previewUsername = function() {
    const fullname = document.getElementById('new-fullname').value;
    const role = document.getElementById('new-role').value;
    
    let cleanName = removeVietnameseTones(fullname).toLowerCase().replace(/\s/g, '');
    if (cleanName.length === 0) {
        document.getElementById('preview-username').innerText = "...";
        return;
    }
    
    let baseUsername = role === 'writer' ? `tw.${cleanName}` : cleanName;
    document.getElementById('preview-username').innerText = baseUsername;
    document.getElementById('preview-password').innerText = role === 'writer' ? 'writer@123' : 'student@123';
}

window.createUser = async function() {
    const fullname = document.getElementById('new-fullname').value;
    const role = document.getElementById('new-role').value;
    if (!fullname) { alert("Vui lòng nhập họ tên!"); return; }

    // Generate Username
    let cleanName = removeVietnameseTones(fullname).toLowerCase().replace(/\s/g, '');
    let baseUsername = role === 'writer' ? `tw.${cleanName}` : cleanName;
    let finalUsername = baseUsername;

    // Check trùng username trên Firebase
    // Logic đơn giản: Thử query xem có chưa, nếu có thì thêm số
    // (Để đơn giản cho prototype, ta sẽ thêm timestamp suffix nếu sợ trùng, hoặc check loop)
    // Ở đây tôi check loop 1 lần, nếu trùng thêm số ngẫu nhiên cho nhanh
    
    const q = query(collection(db, "users"), where("username", "==", finalUsername));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
        finalUsername = `${baseUsername}${Math.floor(Math.random() * 100)}`;
    }

    try {
        await addDoc(collection(db, "users"), {
            fullname: fullname,
            username: finalUsername,
            role: role,
            status: 'active',
            createdAt: new Date().toISOString()
        });
        alert(`Tạo thành công!\nUsername: ${finalUsername}`);
        window.closeModal();
        window.switchTab(role);
    } catch (e) {
        alert("Lỗi: " + e.message);
    }
}

window.toggleStatus = async function(id, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
    await updateDoc(doc(db, "users", id), { status: newStatus });
    window.renderUserList();
}

window.deleteUser = async function(id) {
    if (confirm("Bạn có chắc chắn muốn xóa tài khoản này?")) {
        await deleteDoc(doc(db, "users", id));
        window.renderUserList();
    }
}

// Modal Utils
window.openModal = () => { document.getElementById('user-modal').classList.remove('hidden'); document.getElementById('user-modal').classList.add('flex'); }
window.closeModal = () => { document.getElementById('user-modal').classList.add('hidden'); document.getElementById('user-modal').classList.remove('flex'); }
