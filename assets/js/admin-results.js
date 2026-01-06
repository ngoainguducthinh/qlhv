// assets/js/admin-results.js
import { db, collection, getDocs, query, orderBy, limit } from './firebase-init.js';

document.addEventListener('DOMContentLoaded', () => {
    loadResults();
});

async function loadResults() {
    const tbody = document.getElementById('results-body');
    
    try {
        // Lấy 50 kết quả mới nhất
        const q = query(collection(db, "results"), orderBy("submittedAt", "desc"), limit(50));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-gray-400">Chưa có kết quả nào.</td></tr>`;
            return;
        }

        let html = '';
        snapshot.forEach(doc => {
            const r = doc.data();
            const date = new Date(r.submittedAt).toLocaleString('vi-VN');
            
            // Tô màu điểm
            let scoreColor = 'text-gray-800';
            if(r.score >= 8) scoreColor = 'text-green-600 font-bold';
            else if(r.score < 5) scoreColor = 'text-red-600 font-bold';

            html += `
                <tr class="hover:bg-gray-50 border-b border-gray-100 last:border-0">
                    <td class="px-6 py-4">
                        <div class="font-bold text-gray-700">${r.fullname}</div>
                        <div class="text-xs text-gray-400">@${r.username}</div>
                    </td>
                    <td class="px-6 py-4 font-medium text-blue-600">${r.examTitle}</td>
                    <td class="px-6 py-4 text-lg ${scoreColor}">${r.score}</td>
                    <td class="px-6 py-4 text-sm">${r.correct}/${r.total}</td>
                    <td class="px-6 py-4 text-sm text-gray-500">${date}</td>
                </tr>
            `;
        });
        tbody.innerHTML = html;

    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-red-500">Lỗi: ${error.message}</td></tr>`;
    }
}
