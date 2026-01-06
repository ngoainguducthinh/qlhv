import { db, collection, getDocs, query } from './firebase-init.js';

let allResults = [];

document.addEventListener('DOMContentLoaded', () => {
    loadResults();
});

async function loadResults() {
    const tbody = document.getElementById('results-body');
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8"><i class="fa-solid fa-spinner fa-spin text-blue-500 text-2xl"></i> Đang tải...</td></tr>`;

    try {
        // Lấy tất cả kết quả (Không dùng orderBy để tránh lỗi Index)
        const q = query(collection(db, "results"));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-gray-400">Chưa có bài làm nào được nộp.</td></tr>`;
            return;
        }

        allResults = [];
        snapshot.forEach(doc => {
            allResults.push({ id: doc.id, ...doc.data() });
        });

        renderTable(allResults);

    } catch (error) {
        console.error(error);
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-red-500">Lỗi: ${error.message}</td></tr>`;
    }
}

window.renderTable = function(results) {
    const tbody = document.getElementById('results-body');
    
    // Sắp xếp: Mới nhất lên đầu (Dựa vào submittedAt)
    results.sort((a, b) => {
        const dateA = new Date(a.submittedAt || 0);
        const dateB = new Date(b.submittedAt || 0);
        return dateB - dateA;
    });

    let html = '';
    results.forEach(r => {
        const date = r.submittedAt ? new Date(r.submittedAt).toLocaleString('vi-VN') : '---';
        
        // Tô màu điểm số
        let scoreClass = "text-gray-800 font-bold";
        if (r.score >= 8) scoreClass = "text-green-600 font-bold";
        else if (r.score < 5) scoreClass = "text-red-600 font-bold";

        html += `
            <tr class="hover:bg-gray-50 border-b border-gray-100 last:border-0 transition">
                <td class="px-6 py-4">
                    <div class="font-bold text-gray-800">${r.fullname}</div>
                    <div class="text-xs text-gray-400">@${r.username}</div>
                </td>
                <td class="px-6 py-4">
                    <span class="text-blue-600 font-medium">${r.examTitle}</span>
                </td>
                <td class="px-6 py-4 text-lg ${scoreClass}">
                    ${r.score}
                </td>
                <td class="px-6 py-4 text-sm">
                    <span class="bg-gray-100 px-2 py-1 rounded text-gray-600 text-xs font-bold">
                        ${r.correct}/${r.total} câu đúng
                    </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-500">
                    ${date}
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

window.filterResults = function() {
    const keyword = document.getElementById('search-input').value.toLowerCase();
    
    const filtered = allResults.filter(r => {
        const nameMatch = r.fullname.toLowerCase().includes(keyword);
        const userMatch = r.username.toLowerCase().includes(keyword);
        const titleMatch = r.examTitle.toLowerCase().includes(keyword);
        return nameMatch || userMatch || titleMatch;
    });

    renderTable(filtered);
}
