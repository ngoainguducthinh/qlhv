// assets/js/student-dashboard.js

document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if(user) document.getElementById('user-greeting').innerText = user.fullname;
    
    renderExamList();
    renderChart();
    renderLeaderboard('bee'); // Mặc định hiện tab Ong Chăm Chỉ
});

// --- 1. RENDER DANH SÁCH ĐỀ THI ---
function renderExamList() {
    const container = document.getElementById('exam-list-container');
    const exams = JSON.parse(localStorage.getItem('exams') || "[]");
    const history = JSON.parse(localStorage.getItem('examHistory') || "[]");

    if (exams.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8">
                <img src="https://cdni.iconscout.com/illustration/premium/thumb/empty-state-2130362-1800926.png" class="h-32 mx-auto opacity-50">
                <p class="text-gray-500 mt-2">Chưa có bài tập nào được giao!</p>
            </div>`;
        return;
    }

    container.innerHTML = '';
    
    // Đảo ngược để hiện đề mới nhất lên đầu
    exams.slice().reverse().forEach(exam => {
        // Check xem đã làm chưa
        const attempts = history.filter(h => h.examId === exam.id);
        const bestScore = attempts.length > 0 ? Math.max(...attempts.map(a => a.score)) : null;
        const isDone = attempts.length >= 2; // Giới hạn 2 lần làm

        // Logic thời hạn (7 ngày từ ngày tạo - giả lập ngày tạo là id timestamp)
        // Nếu muốn chuẩn hơn thì lúc tạo đề cần lưu field `createdAt`
        const createdDate = new Date(exam.id); 
        const deadline = new Date(createdDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        const now = new Date();
        const timeLeft = deadline - now;
        const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
        
        let statusHtml = '';
        let btnHtml = '';

        if (timeLeft < 0) {
            statusHtml = `<span class="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded font-bold">Đã hết hạn</span>`;
            btnHtml = `<button class="bg-gray-300 text-white px-4 py-2 rounded-lg text-sm font-bold cursor-not-allowed">Đã khoá</button>`;
        } else if (attempts.length > 0) {
            statusHtml = `<span class="bg-green-100 text-green-700 text-xs px-2 py-1 rounded font-bold">Điểm cao nhất: ${bestScore}</span>`;
            
            if (isDone) {
                btnHtml = `<button class="bg-white border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-50">Xem lại</button>`;
            } else {
                btnHtml = `
                    <button class="bg-white border border-gray-300 text-gray-600 px-3 py-2 rounded-lg text-sm font-bold mr-2">Xem lại</button>
                    <button onclick="window.location.href='do-exam.html?id=${exam.id}'" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 shadow shadow-blue-200">Làm lần 2</button>
                `;
            }
        } else {
            statusHtml = `<span class="bg-red-100 text-red-600 text-xs px-2 py-1 rounded font-bold"><i class="fa-regular fa-clock"></i> Còn ${daysLeft} ngày</span>`;
            btnHtml = `<button onclick="window.location.href='do-exam.html?id=${exam.id}'" class="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition transform hover:-translate-y-0.5">Làm bài</button>`;
        }

        const itemHtml = `
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-blue-200 hover:shadow-sm transition bg-white">
                <div class="flex gap-4 items-center mb-3 sm:mb-0">
                    <div class="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl">
                        ${exam.category.charAt(0)}
                    </div>
                    <div>
                        <div class="flex items-center gap-2 mb-1">
                            <span class="text-[10px] uppercase font-bold text-gray-400 bg-gray-100 px-1.5 rounded">${exam.category}</span>
                            ${statusHtml}
                        </div>
                        <h4 class="font-bold text-gray-800 text-lg">${exam.title}</h4>
                        <p class="text-xs text-gray-500">${exam.questions || 0} câu hỏi • ${exam.duration} phút</p>
                    </div>
                </div>
                <div>
                    ${btnHtml}
                </div>
            </div>
        `;
        container.innerHTML += itemHtml;
    });
}

// --- 2. VẼ BIỂU ĐỒ (CHART.JS) ---
function renderChart() {
    const ctx = document.getElementById('scoreChart').getContext('2d');
    const history = JSON.parse(localStorage.getItem('examHistory') || "[]");
    
    // Lấy 5 bài gần nhất
    const recentHistory = history.slice(-5);
    const labels = recentHistory.map(h => h.examTitle.substring(0, 15) + '...'); // Cắt ngắn tên
    const data = recentHistory.map(h => h.score);

    // Nếu chưa có dữ liệu thì hiện dummy
    if (data.length === 0) {
        // Placeholder text handled by HTML, or add dummy chart
    }

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.length ? labels : ['Demo 1', 'Demo 2', 'Demo 3'],
            datasets: [{
                label: 'Điểm số',
                data: data.length ? data : [0, 0, 0],
                backgroundColor: 'rgba(59, 130, 246, 0.6)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1,
                borderRadius: 4,
                barThickness: 30
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, max: 10 }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// --- 3. BẢNG XẾP HẠNG (MOCKUP) ---
// Vì chưa có Backend để tổng hợp điểm tất cả user, ta sẽ "Fake" dữ liệu này cho đẹp
const MOCK_LEADERBOARD = {
    bee: [ // Ong Chăm Chỉ (Làm nhiều đề nhất)
        { name: "Trần Thị B", avatar: "B", count: 18, highlight: true },
        { name: "Lê Văn C", avatar: "C", count: 15, highlight: false },
        { name: "Phạm Minh D", avatar: "D", count: 12, highlight: false },
    ],
    owl: [ // Cú Mèo Uyên Bác (Điểm trung bình cao nhất)
        { name: "Nguyễn Thảo E", avatar: "E", score: 9.8, highlight: true },
        { name: "Hoàng Văn F", avatar: "F", score: 9.5, highlight: false },
        { name: "Trần Thị B", avatar: "B", score: 9.2, highlight: false },
    ]
};

function switchTab(type) {
    const content = document.getElementById('leaderboard-content');
    const btnBee = document.getElementById('tab-bee');
    const btnOwl = document.getElementById('tab-owl');
    
    // Update style tab
    if (type === 'bee') {
        btnBee.className = "flex-1 py-3 text-center border-b-2 border-yellow-400 text-yellow-600 bg-yellow-50/50 transition font-bold";
        btnOwl.className = "flex-1 py-3 text-center border-b-2 border-transparent text-gray-500 hover:bg-gray-50 transition";
    } else {
        btnOwl.className = "flex-1 py-3 text-center border-b-2 border-indigo-400 text-indigo-600 bg-indigo-50/50 transition font-bold";
        btnBee.className = "flex-1 py-3 text-center border-b-2 border-transparent text-gray-500 hover:bg-gray-50 transition";
    }

    // Render list
    const data = MOCK_LEADERBOARD[type];
    let html = '';
    
    data.forEach((user, idx) => {
        const medalColor = idx === 0 ? 'text-yellow-400' : (idx === 1 ? 'text-gray-400' : 'text-orange-400');
        const valueDisplay = type === 'bee' ? `${user.count} đề` : `${user.score} đ`;
        const icon = type === 'bee' ? '<i class="fa-solid fa-bee text-yellow-500"></i>' : '<i class="fa-solid fa-glasses text-indigo-500"></i>';

        html += `
            <div class="flex items-center p-3 hover:bg-gray-50 rounded-lg transition">
                <div class="w-8 font-bold ${medalColor} text-lg text-center">${idx + 1}</div>
                <div class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600 mx-3 border-2 border-white shadow-sm">
                    ${user.avatar}
                </div>
                <div class="flex-1">
                    <p class="text-sm font-bold text-gray-800">${user.name}</p>
                    <p class="text-xs text-gray-500">Học viên K32</p>
                </div>
                <div class="text-right">
                    <span class="block font-bold text-gray-800">${valueDisplay}</span>
                    <span class="text-[10px] text-gray-400">${idx === 0 ? icon : ''}</span>
                </div>
            </div>
        `;
    });

    content.innerHTML = html;
}
