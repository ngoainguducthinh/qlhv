import { db, collection, getDocs, addDoc, query, where } from './firebase-init.js';

let exams = [];
let students = [];
let selectedExams = new Set();
let selectedStudents = new Set();

document.addEventListener('DOMContentLoaded', async () => {
    await Promise.all([loadExams(), loadStudents()]);
    
    // Search Filters
    document.getElementById('search-exam').addEventListener('input', (e) => renderExams(e.target.value));
    document.getElementById('search-student').addEventListener('input', (e) => renderStudents(e.target.value));
});

async function loadExams() {
    const q = query(collection(db, "exams"));
    const snap = await getDocs(q);
    exams = [];
    snap.forEach(doc => exams.push({id: doc.id, ...doc.data()}));
    renderExams();
}

async function loadStudents() {
    const q = query(collection(db, "users"), where("role", "==", "student"));
    const snap = await getDocs(q);
    students = [];
    snap.forEach(doc => students.push({id: doc.id, ...doc.data()}));
    renderStudents();
}

function renderExams(keyword = '') {
    const container = document.getElementById('exam-list');
    container.innerHTML = '';
    
    exams.filter(e => e.title.toLowerCase().includes(keyword.toLowerCase())).forEach(e => {
        const isChecked = selectedExams.has(e.id);
        container.innerHTML += `
            <div onclick="toggleExam('${e.id}')" class="p-3 border rounded cursor-pointer hover:bg-blue-50 flex items-center gap-3 transition ${isChecked ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200'}">
                <div class="w-5 h-5 border-2 rounded flex items-center justify-center ${isChecked ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'}">
                    ${isChecked ? '<i class="fa-solid fa-check text-xs"></i>' : ''}
                </div>
                <div>
                    <div class="font-bold text-sm text-gray-800">${e.title}</div>
                    <div class="text-xs text-gray-500">${e.category} • ${e.duration}p</div>
                </div>
            </div>
        `;
    });
}

function renderStudents(keyword = '') {
    const container = document.getElementById('student-list');
    container.innerHTML = '';
    
    students.filter(s => s.fullname.toLowerCase().includes(keyword.toLowerCase())).forEach(s => {
        const isChecked = selectedStudents.has(s.username); // Dùng username làm key
        container.innerHTML += `
            <div onclick="toggleStudent('${s.username}')" class="p-3 border rounded cursor-pointer hover:bg-green-50 flex items-center gap-3 transition ${isChecked ? 'border-green-500 bg-green-50 ring-1 ring-green-500' : 'border-gray-200'}">
                <div class="w-5 h-5 border-2 rounded flex items-center justify-center ${isChecked ? 'border-green-600 bg-green-600 text-white' : 'border-gray-300'}">
                    ${isChecked ? '<i class="fa-solid fa-check text-xs"></i>' : ''}
                </div>
                <div>
                    <div class="font-bold text-sm text-gray-800">${s.fullname}</div>
                    <div class="text-xs text-gray-500">@${s.username}</div>
                </div>
            </div>
        `;
    });
}

// Global functions for HTML access
window.toggleExam = (id) => {
    if (selectedExams.has(id)) selectedExams.delete(id); else selectedExams.add(id);
    document.getElementById('exam-count').innerText = `${selectedExams.size} đã chọn`;
    document.getElementById('total-exams').innerText = selectedExams.size;
    renderExams(document.getElementById('search-exam').value);
}

window.toggleStudent = (username) => {
    if (selectedStudents.has(username)) selectedStudents.delete(username); else selectedStudents.add(username);
    document.getElementById('student-count').innerText = `${selectedStudents.size} đã chọn`;
    document.getElementById('total-students').innerText = selectedStudents.size;
    renderStudents(document.getElementById('search-student').value);
}

window.selectAllStudents = () => {
    students.forEach(s => selectedStudents.add(s.username));
    renderStudents();
    document.getElementById('student-count').innerText = `${selectedStudents.size} đã chọn`;
    document.getElementById('total-students').innerText = selectedStudents.size;
}

window.assignExams = async () => {
    if (selectedExams.size === 0 || selectedStudents.size === 0) return alert("Vui lòng chọn ít nhất 1 đề và 1 học viên!");
    
    const confirmMsg = `Giao ${selectedExams.size} đề cho ${selectedStudents.size} học viên?`;
    if (!confirm(confirmMsg)) return;

    try {
        const batch = [];
        const now = new Date().toISOString();
        
        selectedStudents.forEach(username => {
            selectedExams.forEach(examId => {
                // Tạo record assignment
                // ID = username_examId để tránh duplicate
                // Nhưng Firestore addDoc tự sinh ID, ta dùng logic query sau này
                batch.push(addDoc(collection(db, "assignments"), {
                    username: username,
                    examId: examId,
                    assignedAt: now,
                    status: 'assigned' // assigned, completed
                }));
            });
        });

        await Promise.all(batch);
        alert("Giao bài thành công!");
        selectedExams.clear(); selectedStudents.clear();
        window.location.reload();
    } catch (e) {
        alert("Lỗi: " + e.message);
    }
}
