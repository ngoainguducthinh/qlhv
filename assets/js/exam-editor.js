import { db, addDoc, collection, doc, getDoc, updateDoc } from '../../assets/js/firebase-init.js';

window.examData = {
    title: "",
    duration: 60,
    category: "",
    sections: [] 
};

let editingExamId = null;

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (id) {
        editingExamId = id;
        loadExamForEdit(id);
        document.getElementById('page-title').innerText = "Chỉnh sửa Đề thi";
        document.getElementById('btn-save-text').innerText = "Cập nhật";
    }
});

async function loadExamForEdit(id) {
    try {
        const docSnap = await getDoc(doc(db, "exams", id));
        if (docSnap.exists()) {
            window.examData = docSnap.data();
            document.getElementById('exam-title').value = window.examData.title;
            document.getElementById('exam-duration').value = window.examData.duration;
            document.getElementById('exam-category').value = window.examData.category;
            
            if (window.examData.sections && window.examData.sections.length > 0) {
                document.getElementById('empty-state').style.display = 'none';
                window.renderSections();
            }
        }
    } catch (e) { console.error(e); }
}

// --- LOGIC THÊM PHẦN THI ---
window.addSection = function(type) {
    document.getElementById('empty-state').style.display = 'none';
    
    let newSection = {
        id: Date.now(),
        type: type,
        instruction: "",
        content: "",
        questions: []
    };

    switch(type) {
        case 'gap_fill':
            newSection.instruction = "Đọc đoạn văn và chọn từ đúng điền vào chỗ trống.";
            newSection.content = "Example content with {gap}.";
            break;
        case 'reading':
            newSection.instruction = "Đọc đoạn văn và trả lời các câu hỏi bên dưới.";
            break;
        case 'multiple_choice':
            newSection.instruction = "Chọn đáp án đúng nhất.";
            break;
        case 'listening':
            newSection.instruction = "Nghe đoạn hội thoại và trả lời câu hỏi.";
            newSection.content = ""; // Link MP3
            break;
        case 'writing':
            newSection.instruction = "Viết bài luận về chủ đề sau.";
            break;
        case 'matching':
            newSection.instruction = "Nối thông tin cột A với cột B.";
            break;
    }

    window.examData.sections.push(newSection);
    window.renderSections();
}

window.removeSection = function(sectionId) {
    if(confirm("Xóa phần thi này?")) {
        window.examData.sections = window.examData.sections.filter(s => s.id !== sectionId);
        window.renderSections();
        if(window.examData.sections.length === 0) document.getElementById('empty-state').style.display = 'flex';
    }
}

// --- RENDER GIAO DIỆN ---
window.renderSections = function() {
    const container = document.getElementById('sections-container');
    container.innerHTML = '';
    
    window.examData.sections.forEach((section, index) => {
        let typeName = "";
        let colorClass = "";
        
        // Cấu hình màu sắc cho header
        if (section.type === 'gap_fill') { typeName = "ĐIỀN TỪ"; colorClass = "bg-purple-100 text-purple-800"; }
        else if (section.type === 'reading') { typeName = "ĐỌC HIỂU"; colorClass = "bg-blue-100 text-blue-800"; }
        else if (section.type === 'multiple_choice') { typeName = "TRẮC NGHIỆM"; colorClass = "bg-green-100 text-green-800"; }
        else if (section.type === 'listening') { typeName = "NGHE (LISTENING)"; colorClass = "bg-red-100 text-red-800"; }
        else if (section.type === 'matching') { typeName = "NỐI (MATCHING)"; colorClass = "bg-orange-100 text-orange-800"; }
        else if (section.type === 'writing') { typeName = "VIẾT (WRITING)"; colorClass = "bg-gray-200 text-gray-800"; }

        let html = `
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6 scroll-mt-4" id="sec-${section.id}">
                <div class="${colorClass} px-6 py-3 border-b flex justify-between items-center">
                    <h3 class="font-bold uppercase text-sm"><i class="fa-solid fa-layer-group mr-2"></i>Phần ${index + 1}: ${typeName}</h3>
                    <button onclick="removeSection(${section.id})" class="text-gray-500 hover:text-red-600 px-2"><i class="fa-solid fa-trash-can"></i></button>
                </div>
                <div class="p-6 space-y-4">
                    <div>
                        <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Hướng dẫn làm bài</label>
                        <input class="w-full border rounded p-2 text-sm bg-gray-50 focus:bg-white" value="${section.instruction}" onchange="updateSectionData(${section.id}, 'instruction', this.value)">
                    </div>
        `;

        // --- RENDER CONTENT BODY ---
        
        if (section.type === 'gap_fill') {
            html += `
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <textarea class="border rounded p-3 h-48 font-mono text-sm" oninput="handleGapInput(${section.id}, this.value)">${section.content}</textarea>
                    <div id="gap-config-${section.id}" class="bg-gray-50 border p-2 h-48 overflow-y-auto rounded"></div>
                </div>`;
        } 
        else if (section.type === 'reading') {
            html += `
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <textarea class="border rounded p-3 h-60 text-sm" placeholder="Paste bài đọc vào đây..." onchange="updateSectionData(${section.id}, 'content', this.value)">${section.content}</textarea>
                    <div class="flex flex-col h-60">
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-xs font-bold text-gray-500 uppercase">Câu hỏi</span>
                            <button onclick="addQuestion(${section.id})" class="text-xs bg-blue-600 text-white px-2 py-1 rounded">+ Thêm câu</button>
                        </div>
                        <div id="questions-container-${section.id}" class="flex-1 overflow-y-auto bg-gray-50 border rounded p-2 space-y-2"></div>
                    </div>
                </div>`;
        }
        else if (section.type === 'listening') {
            html += `
                <div>
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Link File Nghe (MP3)</label>
                    <input class="w-full border rounded p-2 text-sm mb-4" placeholder="https://example.com/audio.mp3" value="${section.content}" onchange="updateSectionData(${section.id}, 'content', this.value)">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-xs font-bold text-gray-500 uppercase">Câu hỏi</span>
                        <button onclick="addQuestion(${section.id})" class="text-xs bg-red-600 text-white px-2 py-1 rounded">+ Thêm câu</button>
                    </div>
                    <div id="questions-container-${section.id}" class="space-y-3"></div>
                </div>`;
        }
        else if (section.type === 'multiple_choice') {
            html += `
                <div class="flex justify-between items-center mb-2">
                    <span class="text-xs font-bold text-gray-500 uppercase">Danh sách câu hỏi</span>
                    <button onclick="addQuestion(${section.id})" class="text-xs bg-green-600 text-white px-2 py-1 rounded">+ Thêm câu</button>
                </div>
                <div id="questions-container-${section.id}" class="space-y-3"></div>`;
        }
        else if (section.type === 'matching') {
            html += `
                <div class="bg-orange-50 p-2 text-xs text-orange-800 mb-2 rounded border border-orange-200">
                    Nhập <strong>Cột A</strong> vào ô bên trái, <strong>Đáp án đúng (Cột B)</strong> vào ô bên phải.
                </div>
                <div class="flex justify-between items-center mb-2">
                    <span class="text-xs font-bold text-gray-500 uppercase">Các cặp nối</span>
                    <button onclick="addQuestion(${section.id})" class="text-xs bg-orange-600 text-white px-2 py-1 rounded">+ Thêm cặp</button>
                </div>
                <div id="questions-container-${section.id}" class="space-y-2"></div>`;
        }
        else if (section.type === 'writing') {
             html += `
                <div>
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Chủ đề bài viết (Topic)</label>
                    <textarea class="w-full border rounded p-3 h-32 text-sm" onchange="updateSectionData(${section.id}, 'content', this.value)">${section.content}</textarea>
                </div>`;
        }

        html += `</div></div>`;
        container.innerHTML += html;

        // Render chi tiết câu hỏi con
        if (section.type === 'gap_fill') window.handleGapInput(section.id, section.content);
        else if (['reading', 'multiple_choice', 'listening', 'matching'].includes(section.type)) window.renderQuestions(section.id);
    });
}

// --- LOGIC CHI TIẾT ---
window.updateSectionData = (id, key, val) => { window.examData.sections.find(s => s.id === id)[key] = val; }

window.handleGapInput = (sectionId, text) => {
    window.updateSectionData(sectionId, 'content', text);
    const regex = /\{([^}]+)\}/g;
    let match; const gaps = [];
    while ((match = regex.exec(text)) !== null) gaps.push(match[1]);

    const container = document.getElementById(`gap-config-${sectionId}`);
    if(!container) return;

    const section = window.examData.sections.find(s => s.id === sectionId);
    let html = '';
    gaps.forEach(gapName => {
        let q = section.questions.find(i => i.id === gapName);
        if (!q) { q = { id: gapName, options: ["","","",""], answer: "" }; section.questions.push(q); }
        html += `
            <div class="bg-white p-2 mb-2 rounded border text-xs shadow-sm">
                <span class="font-bold text-purple-700 bg-purple-100 px-1 rounded">{${gapName}}</span>
                <div class="grid grid-cols-2 gap-1 mt-1">
                    ${[0,1,2,3].map(i => `<input class="border rounded px-1 py-1" placeholder="Op ${i+1}" value="${q.options[i]}" onchange="updateGapOption(${sectionId}, '${gapName}', ${i}, this.value)">`).join('')}
                </div>
                <select class="mt-1 border rounded w-full py-1" onchange="updateGapAnswer(${sectionId}, '${gapName}', this.value)">
                    <option value="">Chọn đáp án...</option>
                    ${[0,1,2,3].map(i => `<option value="${i}" ${q.answer === q.options[i] && q.answer!="" ? 'selected':''}>Op ${i+1}</option>`).join('')}
                </select>
            </div>`;
    });
    container.innerHTML = html;
}
window.updateGapOption = (secId, gapId, idx, val) => { window.examData.sections.find(s => s.id === secId).questions.find(q => q.id === gapId).options[idx] = val; }
window.updateGapAnswer = (secId, gapId, idx) => { const q = window.examData.sections.find(s => s.id === secId).questions.find(item => item.id === gapId); if(q && idx!=="") q.answer = q.options[parseInt(idx)]; }

window.addQuestion = (secId) => {
    const s = window.examData.sections.find(i => i.id === secId);
    s.questions.push({ id: Date.now(), question_text: "", options: ["","","",""], answer: "A" });
    window.renderQuestions(secId);
}
window.removeQuestion = (secId, qIdx) => {
    window.examData.sections.find(s => s.id === secId).questions.splice(qIdx, 1);
    window.renderQuestions(secId);
}
window.renderQuestions = (secId) => {
    const container = document.getElementById(`questions-container-${secId}`);
    const section = window.examData.sections.find(i => i.id === secId);
    let html = '';

    section.questions.forEach((q, idx) => {
        if (section.type === 'matching') {
            html += `
                <div class="bg-white border p-2 rounded relative flex gap-2 items-center">
                    <input class="border rounded px-2 py-1 w-1/2 text-xs" placeholder="Cột A" value="${q.question_text}" onchange="updateNormalQ(${secId}, ${idx}, 'text', this.value)">
                    <i class="fa-solid fa-arrow-right text-gray-400 text-xs"></i>
                    <input class="border rounded px-2 py-1 w-1/2 text-xs font-bold text-orange-700" placeholder="Cột B (Đúng)" value="${q.answer}" onchange="updateNormalQ(${secId}, ${idx}, 'ans', this.value)">
                    <button onclick="removeQuestion(${secId}, ${idx})" class="text-gray-400 hover:text-red-500"><i class="fa-solid fa-times"></i></button>
                </div>`;
        } else {
            html += `
                <div class="bg-white border p-3 rounded relative hover:shadow-sm">
                    <button onclick="removeQuestion(${secId}, ${idx})" class="absolute top-2 right-2 text-gray-300 hover:text-red-500"><i class="fa-solid fa-times"></i></button>
                    <div class="mb-2 pr-6">
                        <input class="w-full border-b border-gray-200 py-1 text-sm focus:border-blue-500 outline-none" placeholder="Nhập câu hỏi..." value="${q.question_text}" onchange="updateNormalQ(${secId}, ${idx}, 'text', this.value)">
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        ${[0,1,2,3].map(i => `
                            <div class="flex items-center gap-2 group">
                                <input type="radio" name="rd-${section.id}-${q.id}" ${q.answer === ['A','B','C','D'][i] ? 'checked':''} onchange="updateNormalQ(${secId}, ${idx}, 'ans', '${['A','B','C','D'][i]}')">
                                <span class="text-xs font-bold text-gray-400 w-3">${['A','B','C','D'][i]}</span>
                                <input class="flex-1 border rounded px-2 py-1 text-xs group-hover:border-blue-400" value="${q.options[i]}" onchange="updateNormalQ(${secId}, ${idx}, 'opt-${i}', this.value)">
                            </div>
                        `).join('')}
                    </div>
                </div>`;
        }
    });
    container.innerHTML = html;
}
window.updateNormalQ = (secId, qIdx, type, val) => {
    const q = window.examData.sections.find(s => s.id === secId).questions[qIdx];
    if(type==='text') q.question_text = val;
    else if(type==='ans') q.answer = val;
    else q.options[parseInt(type.split('-')[1])] = val;
}

window.saveExam = async function() {
    const title = document.getElementById('exam-title').value;
    if(!title) return alert("Vui lòng nhập tên đề thi!");
    window.examData.title = title;
    window.examData.duration = parseInt(document.getElementById('exam-duration').value) || 60;
    window.examData.category = document.getElementById('exam-category').value;
    window.examData.lastModified = new Date().toISOString();

    try {
        if (editingExamId) {
            await updateDoc(doc(db, "exams", editingExamId), window.examData);
            alert("Đã cập nhật!");
        } else {
            window.examData.createdAt = new Date().toISOString();
            await addDoc(collection(db, "exams"), window.examData);
            alert("Đã tạo mới!");
        }
        window.location.href = "library.html";
    } catch (e) { alert("Lỗi: " + e.message); }
}
