// assets/js/student-dashboard.js
import { db, collection, getDocs, query, where, orderBy } from './firebase-init.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if(user) document.getElementById('user-greeting').innerText = user.fullname;
    
    await renderExamList();
});

async function renderExamList() {
    const container = document.getElementById('exam-list-container');
    container.innerHTML = '<div class="text-center py-4">Đang tải đề thi từ Server...</div>';

    try {
        // 1. Lấy danh sách đề
        const examsSnapshot = await getDocs(collection(db, "exams"));
        const exams = [];
        examsSnapshot.forEach(doc => exams.push({ id: doc.id, ...doc.data() }));

        // 2. Lấy kết quả đã làm của user này
        const user = JSON.parse(localStorage.getItem('currentUser'));
        const q = query(collection(db, "results"), where("username", "==", user.username));
        const historySnap = await getDocs(q);
        const history = [];
        historySnap.forEach(doc => history.push(doc.data()));

        if (exams.length === 0) {
            container.innerHTML = '<div class="text-center text-gray-500">Chưa có bài tập nào.</div>';
            return;
        }

        container.innerHTML = '';
        // Đảo ngược để hiện đề mới nhất
        exams.reverse().forEach(exam => {
            const attempts = history.filter(h => h.examId === exam.id);
            const bestScore = attempts.length > 0 ? Math.max(...attempts.map(a => a.score)) : null;
            
            // Logic hiển thị
            let statusHtml, btnHtml;
            
            if (attempts.length > 0) {
                statusHtml = `<span class="bg-green-100 text-green-700 text-xs px-2 py-1 rounded font-bold">Điểm: ${bestScore}</span>`;
                btnHtml = `
                    <button class="text-gray-500 text-sm font-bold mr-2">Đã làm</button>
                    <button onclick="window.location.href='do-exam.html?id=${exam.id}'" class="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold">Làm lại</button>
                `;
            } else {
                statusHtml = `<span class="bg-red-100 text-red-600 text-xs px-2 py-1 rounded font-bold">Mới</span>`;
                btnHtml = `<button onclick="window.location.href='do-exam.html?id=${exam.id}'" class="bg-blue-600 text-white px-6 py-2 rounded text-sm font-bold shadow-lg">Làm bài</button>`;
            }

            container.innerHTML += `
                <div class="flex items-center justify-between p-4 border rounded-xl hover:shadow-md transition bg-white mb-3">
                    <div class="flex items-center gap-4">
                        <div class="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                            ${exam.category ? exam.category.charAt(0) : 'E'}
                        </div>
                        <div>
                            <div class="flex items-center gap-2 mb-1">
                                <span class="text-[10px] uppercase font-bold bg-gray-100 px-1 rounded">${exam.category}</span>
                                ${statusHtml}
                            </div>
                            <h4 class="font-bold text-gray-800">${exam.title}</h4>
                        </div>
                    </div>
                    <div>${btnHtml}</div>
                </div>
            `;
        });

    } catch (error) {
        console.error(error);
        container.innerHTML = '<p class="text-red-500 text-center">Lỗi tải dữ liệu!</p>';
    }
}
