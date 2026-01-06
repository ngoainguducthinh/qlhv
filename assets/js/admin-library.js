import { db, collection, getDocs, deleteDoc, doc, query } from './firebase-init.js';

let allExams = [];

document.addEventListener('DOMContentLoaded', () => {
    console.log("1. Đã vào trang Library, bắt đầu tải...");
    loadLibrary();
});

async function loadLibrary() {
    const tbody = document.getElementById('library-list-body');
    if (!tbody) {
        console.error("LỖI: Không tìm thấy thẻ <tbody> có id='library-list-body' trong HTML!");
        return;
    }
    
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8">⏳ Đang kết nối Firebase...</td></tr>`;

    try {
        console.log("2. Đang truy vấn collection 'exams'...");
        
        // Truy vấn đơn giản nhất
        const q = query(collection(db, "exams"));
        const snapshot = await getDocs(q);
        
        console.log(`3. Kết nối thành công! Tìm thấy ${snapshot.size} đề thi.`);

        if (snapshot.empty) {
            console.warn("CẢNH BÁO: Firebase trả về rỗng! Hãy kiểm tra xem bạn đã tạo Collection tên là 'exams' chưa? (Phân biệt hoa thường)");
            tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-orange-500">Kết nối thành công nhưng không có dữ liệu (0 đề thi).</td></tr>`;
            return;
        }

        allExams = [];
        snapshot.forEach(doc => {
            console.log("-> Tìm thấy đề:", doc.id, doc.data());
            allExams.push({ id: doc.id, ...doc.data() });
        });

        renderTable(allExams);

    } catch (error) {
        console.error("4. LỖI NGHIÊM TRỌNG:", error);
        
        let msg = error.message;
        if (msg.includes("permission-denied")) {
            msg = "Bị chặn quyền truy cập! (Kiểm tra Rules của Firestore)";
        }
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-red-500 font-bold">LỖI: ${msg}</td></tr>`;
    }
}

window.renderTable = function(exams) {
    const tbody = document.getElementById('library-list-body');
    let html = '';
    
    // Sắp xếp ID giảm dần (tương đối) để đề mới lên đầu
    exams.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

    exams.forEach(exam => {
        let dateDisplay = '---';
        if (exam.createdAt) dateDisplay = new Date(exam.createdAt).toLocaleDateString('vi-VN');

        html += `
            <tr class="hover:bg-gray-50 border-b border-gray-100">
                <td class="px-6 py-4 font-bold text-gray-800">${exam.title}</td>
                <td class="px-6 py-4 text-blue-600 font-bold text-xs">${exam.category || '---'}</td>
                <td class="px-6 py-4 text-sm">${exam.duration} phút</td>
                <td class="px-6 py-4 text-gray-500 text-sm">${dateDisplay}</td>
                <td class="px-6 py-4 text-right">
                    <button onclick="deleteExam('${exam.id}')" class="text-red-500 hover:text-red-700 font-bold text-sm">Xóa</button>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

window.deleteExam = async function(id) {
    if (confirm("Xóa đề này?")) {
        await deleteDoc(doc(db, "exams", id));
        alert("Đã xóa!");
        loadLibrary();
    }
}
// Các hàm filter giữ nguyên hoặc bỏ qua tạm thời để test kết nối trước
window.filterExams = () => {}; 
window.editExam = () => {};
