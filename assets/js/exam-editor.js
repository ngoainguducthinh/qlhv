// assets/js/exam-editor.js
import { db, addDoc, collection, doc, getDoc, updateDoc } from '../../assets/js/firebase-init.js';

window.examData = {
    title: "",
    duration: 60,
    category: "",
    sections: [] 
};

let editingExamId = null; // Biến lưu ID nếu đang ở chế độ sửa

document.addEventListener('DOMContentLoaded', () => {
    // Kiểm tra URL xem có đang sửa đề không
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    
    if (id) {
        editingExamId = id;
        loadExamForEdit(id);
        document.getElementById('page-title').innerText = "Chỉnh sửa Đề thi";
        document.getElementById('btn-save-text').innerText = "Cập nhật Đề";
    }
});

async function loadExamForEdit(id) {
    try {
        const docSnap = await getDoc(doc(db, "exams", id));
        if (docSnap.exists()) {
            const data = docSnap.data();
            window.examData = data;
            
            // Fill dữ liệu vào form
            document.getElementById('exam-title').value = data.title;
            document.getElementById('exam-duration').value = data.duration;
            document.getElementById('exam-category').value = data.category;
            
            // Render các phần thi
            document.getElementById('empty-state').style.display = 'none';
            window.renderSections();
        } else {
            alert("Không tìm thấy đề thi này!");
        }
    } catch (e) {
        console.error(e);
        alert("Lỗi tải đề: " + e.message);
    }
}

// --- CÁC HÀM RENDER GIỮ NGUYÊN ---
window.addSection = function(type) {
    document.getElementById('empty-state').style.display = 'none';
    let newSection = { id: Date.now(), type: type, instruction: "", content: "", questions: [] };
    if (type === 'multiple_choice') newSection.instruction = "Chọn đáp án đúng nhất.";
    else if (type === 'gap_fill') { newSection.instruction = "Điền từ vào chỗ trống."; newSection.content = "Example content {gap1}."; }
    else if (type === 'reading') newSection.instruction = "Đọc đoạn văn và trả lời câu hỏi.";
    window.examData.sections.push(newSection);
    window.renderSections();
}

window.removeSection = function(sectionId) {
    if(confirm("Xóa phần này?")) {
        window.examData.sections = window.examData.sections.filter(s => s.id !== sectionId);
        window.renderSections();
    }
}

window.renderSections = function() {
    const container = document.getElementById('sections-container');
    container.innerHTML = '';
    
    if (window.examData.sections.length === 0) {
        document.getElementById('empty-state').style.display = 'block';
        return;
    }

    window.examData.sections.forEach((section, index) => {
        let html = `
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                <div class="bg-gray-50 px-6 py-3 border-b flex justify-between">
                    <h3 class="font-bold">Phần ${index+1}</h3>
                    <button onclick="removeSection(${section.id})" class="text-red-500"><i class="fa-solid fa-trash"></i></button>
                </div>
                <div class="p-6 space-y-4">
                    <input type="text" class="w-full border rounded p-2 text-sm bg-gray-50" 
                        value="${section.instruction}" placeholder="Hướng dẫn làm bài..."
                        onchange="updateSectionData(${section.id}, 'instruction', this.value)">
        `;

        if (section.type === 'gap_fill') {
            html += `
                <div class="grid grid-cols-2 gap-4">
                    <textarea class="border rounded p-2 h-64 font-mono" oninput="handleGapInput(${section.id}, this.value)">${section.content}</textarea>
                    <div id="gap-config-${section.id}" class="h-64 overflow-y-auto bg-purple-50 p-2 rounded"></div>
                </div>`;
        } else if (section.type === 'reading') {
            html += `
                <textarea class="w-full border rounded p-2 h-40 mb-2" placeholder="Nội dung bài đọc..." onchange="updateSectionData(${section.id}, 'content', this.value)">${section.content}</textarea>
                <button onclick="addQuestionToSection(${section.id})" class="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">+ Thêm câu hỏi</button>
                <div id="questions-container-${section.id}" class="space-y-2 mt-2"></div>
            `;
        } else {
            html += `
                <button onclick="addQuestionToSection(${section.id})" class="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">+ Thêm câu hỏi</button>
                <div id="questions-container-${section.id}" class="space-y-2 mt-2"></div>
            `;
        }
        html += `</div></div>`;
        container.innerHTML += html;

        if (section.type === 'gap_fill') window.handleGapInput(section.id, section.content);
        else window.renderQuestions(section.id);
    });
}

window.handleGapInput = function(sectionId, text) {
    window.updateSectionData(sectionId, 'content', text);
    const regex = /\{([^}]+)\}/g;
    let match; const gaps = [];
    while ((match = regex.exec(text)) !== null) gaps.push(match[1]);

    const container = document.getElementById(`gap-config-${sectionId}`);
    if(!container) return;

    const section = window.examData.sections.find(s => s.id === sectionId);
    let html = '';

    gaps.forEach((gapName) => {
        let q = section.questions.find(i => i.id === gapName);
        if (!q) { q = { id: gapName, options: ["","","",""], answer: "" }; section.questions.push(q); }

        html += `
            <div class="bg-white p-2 mb-2 rounded border text-sm">
                <span class="font-bold text-purple-700">{${gapName}}</span>
                <div class="grid grid-cols-2 gap-1 mt-1">
                    ${[0,1,2,3].map(i => `<input class="border rounded px-1" placeholder="${['A','B','C','D'][i]}" value="${q.options[i]}" onchange="updateGapOption(${sectionId}, '${gapName}', ${i}, this.value)">`).join('')}
                </div>
                <select class="mt-1 border rounded w-full text-xs" onchange="updateGapAnswer(${sectionId}, '${gapName}', this.value)">
                    <option value="">Chọn đáp án...</option>
                    ${[0,1,2,3].map(i => `<option value="${i}" ${q.answer === q.options[i] && q.answer!="" ? 'selected':''}>${['A','B','C','D'][i]}</option>`).join('')}
                </select>
            </div>
        `;
    });
    container.innerHTML = html;
}

window.updateSectionData = (id, key, val) => { window.examData.sections.find(s => s.id === id)[key] = val; }
window.updateGapOption = (secId, gapId, idx, val) => { window.examData.sections.find(s => s.id === secId).questions.find(q => q.id === gapId).options[idx] = val; }
window.updateGapAnswer = (secId, gapId, idx) => { 
    const q = window.examData.sections.find(s => s.id === secId).questions.find(item => item.id === gapId);
    q.answer = q.options[parseInt(idx)];
}

window.addQuestionToSection = (secId) => {
    const s = window.examData.sections.find(i => i.id === secId);
    s.questions.push({ id: Date.now(), question_text: "", options: ["","","",""], answer: "A" });
    window.renderQuestions(secId);
}
window.renderQuestions = (secId) => {
    const container = document.getElementById(`questions-container-${secId}`);
    const s = window.examData.sections.find(i => i.id === secId);
    let html = '';
    s.questions.forEach((q, idx) => {
        html += `
            <div class="border p-2 rounded relative">
                <input class="border-b w-full mb-1" placeholder="Câu hỏi..." value="${q.question_text}" onchange="updateNormalQ(${secId}, ${idx}, 'text', this.value)">
                <div class="grid grid-cols-2 gap-2">
                     ${[0,1,2,3].map(i => `
                        <div class="flex items-center gap-1">
                            <input type="radio" name="r-${q.id}" ${q.answer === ['A','B','C','D'][i] ? 'checked':''} onchange="updateNormalQ(${secId}, ${idx}, 'ans', '${['A','B','C','D'][i]}')">
                            <input class="border rounded w-full text-xs" value="${q.options[i]}" onchange="updateNormalQ(${secId}, ${idx}, 'opt-${i}', this.value)">
                        </div>
                     `).join('')}
                </div>
                <button onclick="removeQuestion(${secId}, ${idx})" class="absolute top-1 right-1 text-red-400 text-xs"><i class="fa-solid fa-times"></i></button>
            </div>
        `;
    });
    container.innerHTML = html;
}
window.updateNormalQ = (secId, qIdx, type, val) => {
    const q = window.examData.sections.find(s => s.id === secId).questions[qIdx];
    if(type==='text') q.question_text = val;
    else if(type==='ans') q.answer = val;
    else q.options[parseInt(type.split('-')[1])] = val;
}
window.removeQuestion = (secId, qIdx) => {
    window.examData.sections.find(s => s.id === secId).questions.splice(qIdx, 1);
    window.renderQuestions(secId);
}

// --- LOGIC LƯU (SAVE/UPDATE) QUAN TRỌNG ---
window.saveExam = async function() {
    const title = document.getElementById('exam-title').value;
    if(!title) return alert("Nhập tên đề!");
    
    window.examData.title = title;
    window.examData.duration = parseInt(document.getElementById('exam-duration').value);
    window.examData.category = document.getElementById('exam-category').value;
    window.examData.lastModified = new Date().toISOString();

    try {
        if (editingExamId) {
            // CASE 1: CẬP NHẬT ĐỀ CŨ
            await updateDoc(doc(db, "exams", editingExamId), window.examData);
            alert("Đã cập nhật đề thi thành công!");
        } else {
            // CASE 2: TẠO MỚI
            window.examData.createdAt = new Date().toISOString();
            await addDoc(collection(db, "exams"), window.examData);
            alert("Đã lưu đề mới thành công!");
        }
        window.location.href = "library.html"; // Quay về thư viện thay vì dashboard
    } catch (e) {
        alert("Lỗi: " + e.message);
    }
}

// Hàm bổ trợ cho nút toggle JSON (giữ nguyên hoặc xóa nếu không dùng)
window.toggleJsonMode = () => { /* ...giữ nguyên logic cũ... */ }
window.applyJson = () => { /* ...giữ nguyên logic cũ... */ }
