import { db, collection, getDocs, deleteDoc, doc, query } from './firebase-init.js';

let allExams = [];

document.addEventListener('DOMContentLoaded', () => {
    loadLibrary();
});

async function loadLibrary() {
    const tbody = document.getElementById('library-list-body');
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8"><i class="fa-solid fa-spinner fa-spin text-blue-500 text-2xl"></i> Đang tải...</td></tr>`;

    try {
        // Lấy toàn bộ danh sách đề thi (Bỏ sắp xếp tạm thời để tránh lỗi Index)
        const q = query(collection(db, "exams"));
        const snapshot = await getDocs(q);
        
        allExams = [];
        snapshot.forEach(doc => {
            // Lấy data và gán thêm ID vào object
            allExams.push({ id: doc.id, ...doc.data() });
        });

        renderTable(allExams);

    } catch (error) {
        console.error("Chi tiết lỗi:", error);
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-red-500">Lỗi tải dữ liệu: ${error.message}</td></tr>`;
    }
}

// Gán các hàm vào window để HTML gọi được
window.renderTable = function(exams) {
    const tbody = document.getElementById('library-list-body');
    if (exams.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-gray-400">Chưa có đề thi nào trong hệ thống.</td></tr>`;
        return;
    }

    let html = '';
    // Sắp xếp thủ công bằng JS (Mới nhất lên đầu)
    exams.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA; 
    });

    exams.forEach(exam => {
        // Xử lý ngày tháng hiển thị
        let dateDisplay = '---';
        if (exam.createdAt) {
            dateDisplay = new Date(exam.createdAt).toLocaleDateString('vi-VN');
        } else if (exam.lastModified) {
             dateDisplay = new Date(exam.lastModified).toLocaleDateString('vi-VN');
        }

        html += `
            <tr class="hover:bg-gray-50 transition border-b border-gray-100 last:border-0">
                <td class="px-6 py-4">
                    <div class="font-bold text-gray-800">${exam.title}</div>
                    <div class="text-xs text-gray-400">${exam.sections ? exam.sections.length : 0} phần thi</div>
                </td>
                <td class="px-6 py-4"><span class="bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs font-bold">${exam.category || 'General'}</span></td>
                <td class="px-6 py-4 text-sm">${exam.duration} phút</td>
                <td class="px-6 py-4 text-sm text-gray-500">${dateDisplay}</td>
                <td class="px-6 py-4 text-right">
                    <button onclick="editExam('${exam.id}')" class="bg-blue-100 text-blue-600 hover:bg-blue-200 px-3 py-1.5 rounded-lg text-xs font-bold mr-2 transition">
                        <i class="fa-solid fa-pen mr-1"></i> Sửa
                    </button>
                    <button onclick="deleteExam('${exam.id}')" class="bg-red-100 text-red-600 hover:bg-red-200 px-3 py-1.5 rounded-lg text-xs font-bold transition">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

window.filterExams = function() {
    const text = document.getElementById('search-input').value.toLowerCase();
    const cat = document.getElementById('filter-category').value;

    const filtered = allExams.filter(e => {
        const title = e.title ? e.title.toLowerCase() : "";
        const matchText = title.includes(text);
        const matchCat = cat === "" || e.category === cat;
        return matchText && matchCat;
    });
    renderTable(filtered);
}

window.deleteExam = async function(id) {
    if (confirm("Bạn có chắc chắn muốn xóa đề thi này không? Hành động này không thể hoàn tác.")) {
        try {
            await deleteDoc(doc(db, "exams", id));
            // Xóa xong thì load lại danh sách từ bộ nhớ cục bộ cho nhanh
            allExams = allExams.filter(e => e.id !== id);
            renderTable(allExams);
            alert("Đã xóa đề thi.");
        } catch (e) {
            alert("Lỗi: " + e.message);
        }
    }
}

window.editExam = function(id) {
    window.location.href = `create-exam.html?id=${id}`;
}
