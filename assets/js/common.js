// assets/js/common.js

// 1. Cấu hình Menu cho từng vai trò
const MENUS = {
    admin: [
        { name: "Tổng quan", icon: "fa-chart-pie", link: "../admin/dashboard.html" },
        { name: "Tạo Đề Thi", icon: "fa-file-circle-plus", link: "../admin/create-exam.html" },
        { name: "Thư viện Đề", icon: "fa-book", link: "../admin/library.html" },
        { name: "Quản lý Tài khoản", icon: "fa-users-cog", link: "../admin/users.html" },
        { name: "Giao Bài", icon: "fa-paper-plane", link: "../admin/assign.html" },
        { name: "Kết Quả & BXH", icon: "fa-trophy", link: "../admin/results.html" }
    ],
    writer: [
        { name: "Tạo Đề Thi", icon: "fa-file-circle-plus", link: "../admin/create-exam.html" },
        { name: "Thư viện Đề", icon: "fa-book", link: "../admin/library.html" }
    ],
    student: [
        { name: "Bài tập của tôi", icon: "fa-list-check", link: "../student/dashboard.html" },
        { name: "Lịch sử làm bài", icon: "fa-clock-rotate-left", link: "../student/history.html" },
        { name: "Bảng Xếp Hạng", icon: "fa-medal", link: "../student/ranking.html" }
    ]
};

// 2. Hàm khởi tạo Layout (Chạy khi load trang)
function initLayout() {
    const userJson = localStorage.getItem('currentUser');
    if (!userJson) {
        // Chưa đăng nhập thì đá về login
        window.location.href = '../auth/login.html';
        return;
    }

    const user = JSON.parse(userJson);
    renderSidebar(user);
    renderHeader(user);
}

// 3. Render Sidebar
function renderSidebar(user) {
    const sidebarContainer = document.getElementById('sidebar-container');
    if (!sidebarContainer) return;

    const menuItems = MENUS[user.role] || [];
    
    let menuHtml = `
        <div class="h-16 flex items-center justify-center border-b border-gray-800">
            <h1 class="text-xl font-bold text-white"><i class="fa-solid fa-graduation-cap mr-2"></i>EduManager</h1>
        </div>
        <nav class="flex-1 px-4 py-6 space-y-2">
    `;

    // Lấy tên file hiện tại để active menu
    const currentPath = window.location.pathname;

    menuItems.forEach(item => {
        const isActive = currentPath.includes(item.link.replace('..', '')); // Logic check active đơn giản
        const activeClass = isActive ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white";
        
        menuHtml += `
            <a href="${item.link}" class="flex items-center px-4 py-3 rounded-lg font-medium transition-colors ${activeClass}">
                <i class="fa-solid ${item.icon} w-8"></i> ${item.name}
            </a>
        `;
    });

    menuHtml += `</nav>
        <div class="p-4 border-t border-gray-800">
            <button onclick="logout()" class="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-gray-800 rounded-lg transition-colors">
                <i class="fa-solid fa-sign-out-alt w-8"></i> Đăng xuất
            </button>
        </div>
    `;

    sidebarContainer.innerHTML = menuHtml;
    // Thêm class style cơ bản cho sidebar
    sidebarContainer.className = "w-64 bg-gray-900 text-white flex flex-col h-screen fixed left-0 top-0 hidden md:flex z-50";
}

// 4. Render Header
function renderHeader(user) {
    const headerContainer = document.getElementById('header-container');
    if (!headerContainer) return;

    const roleNames = { admin: "Administrator", writer: "Test Writer", student: "Học viên" };

    headerContainer.innerHTML = `
        <div class="flex items-center justify-between px-6 h-16 bg-white border-b border-gray-200 ml-0 md:ml-64 transition-all">
            <div class="flex items-center md:hidden">
                <button class="text-gray-500 hover:text-gray-700"><i class="fa-solid fa-bars text-xl"></i></button>
            </div>
            <div class="flex items-center ml-auto space-x-4">
                <div class="text-right hidden sm:block">
                    <p class="text-sm font-bold text-gray-800">${user.fullname || user.username}</p>
                    <p class="text-xs text-gray-500">${roleNames[user.role]}</p>
                </div>
                <img src="https://ui-avatars.com/api/?name=${user.username}&background=0D8ABC&color=fff" class="h-9 w-9 rounded-full border">
            </div>
        </div>
    `;
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = '../auth/login.html';
}
