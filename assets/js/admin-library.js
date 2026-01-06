// assets/js/admin-library.js
import { db, collection, getDocs, deleteDoc, doc, orderBy, query } from './firebase-init.js';

let allExams = [];

document.addEventListener('DOMContentLoaded', () => {
    loadLibrary();
});

async function loadLibrary() {
    const tbody = document.getElementById('library-list-body');
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8"><i class="fa-solid fa-spinner fa-spin text-blue-500 text-2xl"></i></td></tr>`;

    try {
        const q = query(collection(db, "exams"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        
        allExams = [];
        snapshot.forEach(doc => allExams.push({ id: doc.id, ...doc.data() }));

        renderTable(allExams);

    } catch (error) {
        console.error(error);
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-red-500">Lỗi tải dữ liệu: ${error.message}</td></tr>`;
    }
}

window.renderTable = function(exams) {
    const tbody = document.getElementById('library-list-body');
    if (exams.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-gray-400">Chưa có đề thi nào.</td></tr>`;
        return;
    }

    let html = '';
    exams.forEach(exam => {
        const date = exam.createdAt ? new Date(exam.createdAt).toLocaleDateString('vi-VN') : '---';
        
        html += `
            <tr class="hover:bg-gray-50 transition border-b border-gray-100 last:border-0">
                <td class="px-6 py-4">
                    <div class="font-bold text-gray-800">${exam.title}</div>
                    <div class="text-xs text-gray-400">${exam.sections ? exam.sections.length : 0} phần thi</div>
                </td>
                <td class="px-6 py-4"><span class="bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs font-bold">${exam.category || 'General'}</span></td>
                <td class="px-6 py-4 text-sm">${exam.duration} phút</td>
                <td class="px-6 py-4 text-sm text-gray-500">${date}</td>
                <td class="px-6 py-4 text-right">
                    <button onclick="editExam('${exam.id}')" class="bg-blue-100 text-blue-600 hover:bg-blue-200 px-3 py-1.5 rounded-lg text-xs font-bold mr-2">
                        <i class="fa-solid fa-pen mr-1"></i> Sửa
                    </button>
                    <button onclick="deleteExam('${exam.id}')" class="bg-red-100 text-red-600 hover:bg-red-200 px-3 py-1.5 rounded-lg text-xs font-bold">
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
        const matchText = e.title.toLowerCase().includes(text);
        const matchCat = cat === "" || e.category === cat;
        return matchText && matchCat;
    });
    renderTable(filtered);
}

window.deleteExam = async function(id) {
    if (confirm("Bạn có chắc chắn muốn xóa đề thi này không? Hành động này không thể hoàn tác.")) {
        try {
            await deleteDoc(doc(db, "exams", id));
            alert("Đã xóa đề thi.");
            loadLibrary(); // Reload lại bảng
        } catch (e) {
            alert("Lỗi: " + e.message);
        }
    }
}

window.editExam = function(id) {
    // Chuyển sang trang create-exam nhưng kèm theo ID để sửa
    window.location.href = `create-exam.html?id=${id}`;
}
