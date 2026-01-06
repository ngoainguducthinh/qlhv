import { db, collection, getDocs, query, where } from './firebase-init.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if(user) document.getElementById('user-greeting').innerText = user.fullname;
    
    await renderAssignedExams();
    renderLeaderboard(); // Hàm này sẽ xử lý sau
});

async function renderAssignedExams() {
    const container = document.getElementById('exam-list-container');
    container.innerHTML = '<div class="text-center py-4">Đang tải bài tập...</div>';

    try {
        const user = JSON.parse(localStorage.getItem('currentUser'));

        // 1. Lấy danh sách Assignments của user này
        const assignQ = query(collection(db, "assignments"), where("username", "==", user.username));
        const assignSnap = await getDocs(assignQ);
        
        if (assignSnap.empty) {
            container.innerHTML = '<div class="text-center py-8 text-gray-500">Bạn chưa được giao bài tập nào.</div>';
            return;
        }

        const examIds = [];
        assignSnap.forEach(doc => examIds.push({ 
            examId: doc.data().examId, 
            assignedAt: doc.data().assignedAt 
        }));

        // 2. Lấy thông tin chi tiết của từng Đề thi
        // (Trong thực tế nên tối ưu bằng cách lưu title vào assignment luôn, nhưng ở đây ta query lại)
        const exams = [];
        // Note: Firestore không hỗ trợ "IN" query quá 10 phần tử, nên loop lấy cho chắc
        const examsRef = collection(db, "exams");
        const allExamsSnap = await getDocs(examsRef); // Lấy hết đề về filter cho nhanh (với data nhỏ)
        
        const allExamsMap = {};
        allExamsSnap.forEach(doc => allExamsMap[doc.id] = doc.data());

        // 3. Lấy kết quả đã làm
        const resultQ = query(collection(db, "results"), where("username", "==", user.username));
        const resultSnap = await getDocs(resultQ);
        const history = [];
        resultSnap.forEach(doc => history.push(doc.data()));

        container.innerHTML = '';
        
        // Render danh sách ĐÃ ĐƯỢC GIAO
        // Sắp xếp theo ngày giao mới nhất
        examIds.sort((a, b) => new Date(b.assignedAt) - new Date(a.assignedAt));

        examIds.forEach(assign => {
            const exam = allExamsMap[assign.examId];
            if (!exam) return; // Đề có thể đã bị admin xóa

            const attempts = history.filter(h => h.examId === assign.examId);
            const bestScore = attempts.length > 0 ? Math.max(...attempts.map(a => a.score)) : null;
            
            // Logic đếm ngược 7 ngày
            const deadline = new Date(new Date(assign.assignedAt).getTime() + 7 * 24 * 60 * 60 * 1000);
            const daysLeft = Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24));
            
            let statusHtml, btnHtml;
            
            if (daysLeft < 0) {
                 statusHtml = `<span class="bg-gray-200 text-gray-500 text-xs px-2 py-1 rounded font-bold">Hết hạn</span>`;
                 btnHtml = `<button disabled class="bg-gray-300 text-white px-4 py-2 rounded text-sm font-bold cursor-not-allowed">Đã khóa</button>`;
            } else if (attempts.length > 0) {
                statusHtml = `<span class="bg-green-100 text-green-700 text-xs px-2 py-1 rounded font-bold">Điểm cao nhất: ${bestScore}</span>`;
                if (attempts.length >= 2) {
                     btnHtml = `<button disabled class="bg-gray-100 text-gray-500 px-4 py-2 rounded text-sm font-bold">Đã làm 2/2 lần</button>`;
                } else {
                     btnHtml = `<button onclick="window.location.href='do-exam.html?id=${assign.examId}'" class="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-blue-700">Làm lần 2</button>`;
                }
            } else {
                statusHtml = `<span class="bg-red-100 text-red-600 text-xs px-2 py-1 rounded font-bold">Còn ${daysLeft} ngày</span>`;
                btnHtml = `<button onclick="window.location.href='do-exam.html?id=${assign.examId}'" class="bg-blue-600 text-white px-6 py-2 rounded text-sm font-bold shadow-lg hover:bg-blue-700">Làm bài</button>`;
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
                            <p class="text-xs text-gray-400">Giao ngày: ${new Date(assign.assignedAt).toLocaleDateString('vi-VN')}</p>
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

// Hàm Bảng Xếp Hạng thật (Lấy top điểm cao)
async function renderLeaderboard() {
    const content = document.getElementById('leaderboard-content');
    if(!content) return; // Nếu ko có thẻ này thì bỏ qua
    
    try {
        // Lấy tất cả kết quả về xử lý client-side cho nhanh (vì query phức tạp)
        const snap = await getDocs(collection(db, "results"));
        const userScores = {};

        snap.forEach(doc => {
            const d = doc.data();
            // Tính trung bình cộng nếu muốn, hoặc lấy tổng điểm
            // Ở đây ta demo: Đếm số bài đã làm (Ong Chăm Chỉ)
            if (!userScores[d.username]) userScores[d.username] = { name: d.fullname, count: 0, totalScore: 0 };
            userScores[d.username].count++;
            userScores[d.username].totalScore += d.score;
        });

        // Convert to array
        const lbArray = Object.values(userScores).sort((a, b) => b.count - a.count).slice(0, 5); // Top 5 chăm chỉ

        let html = '';
        lbArray.forEach((u, idx) => {
            const colors = ['text-yellow-500', 'text-gray-400', 'text-orange-500'];
            const color = idx < 3 ? colors[idx] : 'text-gray-600';
            
            html += `
                <div class="flex items-center p-3 hover:bg-gray-50 rounded-lg transition border-b border-gray-50 last:border-0">
                    <div class="w-6 font-bold ${color} text-center">${idx + 1}</div>
                    <div class="flex-1 ml-3">
                        <p class="text-sm font-bold text-gray-800">${u.name}</p>
                        <p class="text-[10px] text-gray-500">Điểm tổng: ${u.totalScore.toFixed(1)}</p>
                    </div>
                    <div class="font-bold text-blue-600 text-sm">${u.count} bài</div>
                </div>
            `;
        });
        content.innerHTML = html || '<p class="text-center text-sm p-4">Chưa có dữ liệu.</p>';

    } catch (e) {
        console.error(e);
    }
}
