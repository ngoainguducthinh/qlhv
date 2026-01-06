import { db, addDoc, collection, doc, getDoc, updateDoc } from '../../assets/js/firebase-init.js';

// Dữ liệu đề thi toàn cục
window.examData = {
    title: "",
    duration: 60,
    category: "",
    sections: [] // Mảng chứa các phần thi (Mixed Types)
};

let editingExamId = null;

// --- INIT: KIỂM TRA CHẾ ĐỘ SỬA ---
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
            // Fill dữ liệu Header
            document.getElementById('exam-title').value = window.examData.title;
            document.getElementById('exam-duration').value = window.examData.duration;
            document.getElementById('exam-category').value = window.examData.category;
            
            document.getElementById('empty-state').style.display = 'none';
            window.renderSections();
        }
    } catch (e) { alert("Lỗi tải đề: " + e.message); }
}

// --- 1. THÊM PHẦN THI (SECTION) ---
window.addSection = function(type) {
    document.getElementById('empty-state').style.display = 'none';
    
    let newSection = {
        id: Date.now(),
        type: type,
        instruction: "",
        content: "", // Dùng cho Text đoạn văn hoặc Link Audio
        questions: []
    };

    // Cấu hình mặc định cho từng loại
    switch(type) {
        case 'gap_fill':
            newSection.instruction = "Đọc đoạn văn và chọn từ đúng điền vào chỗ trống.";
            newSection.content = "Example content with {gap}.";
            break;
        case 'reading':
            newSection.instruction = "Đọc đoạn văn và trả lời các câu hỏi bên dưới.";
            newSection.content = ""; // Để trống cho user paste bài đọc
            break;
        case 'multiple_choice':
            newSection.instruction = "Chọn đáp án đúng nhất.";
            break;
        case 'listening':
            newSection.instruction = "Nghe đoạn hội thoại và trả lời câu hỏi.";
            newSection.content = ""; // Link file MP3
            break;
        case 'writing':
            newSection.instruction = "Viết một bài luận về chủ đề sau.";
            newSection.content = "Topic: ...";
            break;
        case 'matching':
            newSection.instruction = "Nối thông tin ở cột A với cột B.";
            break;
    }

    // Đẩy vào mảng sections (Tạo tính năng nhiều dạng bài trong 1 đề)
    window.examData.sections.push(newSection);
    window.renderSections();
}

window.removeSection = function(sectionId) {
    if(confirm("Bạn chắc chắn muốn xóa phần thi này?")) {
        window.examData.sections = window.examData.sections.filter(s => s.id !== sectionId);
        window.renderSections();
        if(window.examData.sections.length === 0) document.getElementById('empty-state').style.display = 'block';
    }
}

// --- 2. RENDER GIAO DIỆN (QUAN TRỌNG) ---
window.renderSections = function() {
    const container = document.getElementById('sections-container');
    container.innerHTML = '';
    
    window.examData.sections.forEach((section, index) => {
        // Xác định màu sắc header cho dễ phân biệt
        let headerColor = "bg-gray-50 text-gray-700";
        let typeName = "";
        
        if (section.type === 'gap_fill') { typeName = "ĐỌC - ĐIỀN TỪ"; headerColor = "bg-purple-100 text-purple-800"; }
        else if (section.type === 'reading') { typeName = "ĐỌC HIỂU"; headerColor = "bg-blue-100 text-blue-800"; }
        else if (section.type === 'multiple_choice') { typeName = "TRẮC NGHIỆM"; headerColor = "bg-green-100 text-green-800"; }
        else if (section.type === 'listening') { typeName = "NGHE (LISTENING)"; headerColor = "bg-red-100 text-red-800"; }
        else if (section.type === 'writing') { typeName = "VIẾT (WRITING)"; headerColor = "bg-yellow-100 text-yellow-800"; }
        else if (section.type === 'matching') { typeName = "NỐI (MATCHING)"; headerColor = "bg-orange-100 text-orange-800"; }

        let html = `
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
                <div class="${headerColor} px-6 py-3 border-b flex justify-between items-center">
                    <h3 class="font-bold uppercase text-sm">Phần ${index + 1}: ${typeName}</h3>
                    <button onclick="removeSection(${section.id})" class="text-gray-500 hover:text-red-600"><i class="fa-solid fa-trash-can"></i></button>
                </div>
                
                <div class="p-6 space-y-4">
                    <div>
                        <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Yêu cầu đề bài</label>
                        <input type="text" class="w-full border rounded p-2 text-sm bg-gray-50 focus:bg-white transition" 
                            value="${section.instruction}" placeholder="Nhập hướng dẫn làm bài..."
                            onchange="updateSectionData(${section.id}, 'instruction', this.value)">
                    </div>
        `;

        // --- RENDER BODY TÙY LOẠI ---

        // 1. GAP FILL (ĐIỀN TỪ)
        if (section.type === 'gap_fill') {
            html += `
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Đoạn văn (Dùng {tu_khoa} để tạo ô trống)</label>
                        <textarea class="w-full border rounded p-3 h-60 font-mono text-sm leading-relaxed" 
                            oninput="handleGapInput(${section.id}, this.value)">${section.content}</textarea>
                    </div>
                    <div class="bg-purple-50 p-3 rounded h-60 overflow-y-auto border border-purple-100">
                        <label class="block text-xs font-bold text-purple-700 uppercase mb-2">Cấu hình đáp án</label>
                        <div id="gap-config-${section.id}"></div>
                    </div>
                </div>`;
        } 
        
        // 2. READING (ĐỌC HIỂU)
        else if (section.type === 'reading') {
            html += `
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Bài đọc (Passage)</label>
                        <textarea class="w-full border rounded p-3 h-80 text-sm leading-relaxed" 
                            placeholder="Paste nội dung bài đọc vào đây..."
                            onchange="updateSectionData(${section.id}, 'content', this.value)">${section.content}</textarea>
                    </div>
                    <div class="flex flex-col h-80">
                        <div class="flex justify-between items-center mb-2">
                            <label class="block text-xs font-bold text-gray-500 uppercase">Câu hỏi</label>
                            <button onclick="addQuestion(${section.id})" class="text-xs bg-blue-600 text-white px-3 py-1 rounded font-bold hover:bg-blue-700">+ Thêm câu</button>
                        </div>
                        <div id="questions-container-${section.id}" class="flex-1 overflow-y-auto bg-gray-50 p-2 rounded border space-y-3"></div>
                    </div>
                </div>`;
        }

        // 3. MULTIPLE CHOICE (TRẮC NGHIỆM ĐƠN)
        else if (section.type === 'multiple_choice') {
            html += `
                <div>
                    <div class="flex justify-between items-center mb-2">
                        <label class="block text-xs font-bold text-gray-500 uppercase">Danh sách câu hỏi</label>
                        <button onclick="addQuestion(${section.id})" class="text-xs bg-green-600 text-white px-3 py-1 rounded font-bold hover:bg-green-700">+ Thêm câu</button>
                    </div>
                    <div id="questions-container-${section.id}" class="space-y-3"></div>
                </div>`;
        }

        // 4. LISTENING (NGHE)
        else if (section.type === 'listening') {
            html += `
                <div>
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Link Audio (MP3 URL)</label>
                    <input type="text" class="w-full border rounded p-2 text-sm mb-4" 
                        value="${section.content}" placeholder="https://example.com/audio.mp3"
                        onchange="updateSectionData(${section.id}, 'content', this.value)">
                    
                    <div class="flex justify-between items-center mb-2">
                        <label class="block text-xs font-bold text-gray-500 uppercase">Câu hỏi</label>
                        <button onclick="addQuestion(${section.id})" class="text-xs bg-red-600 text-white px-3 py-1 rounded font-bold hover:bg-red-700">+ Thêm câu</button>
                    </div>
                    <div id="questions-container-${section.id}" class="space-y-3"></div>
                </div>`;
        }
        
        // 5. WRITING (VIẾT)
        else if (section.type === 'writing') {
             html += `
                <div>
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Chủ đề (Topic)</label>
                    <textarea class="w-full border rounded p-3 h-32 text-sm" 
                        onchange="updateSectionData(${section.id}, 'content', this.value)">${section.content}</textarea>
                </div>`;
        }

        // 6. MATCHING (NỐI) - (Cơ bản: Dùng text question như cặp nối)
        else if (section.type === 'matching') {
             html += `
                <div class="bg-orange-50 p-4 rounded text-sm text-orange-800 mb-2">
                    <i class="fa-solid fa-circle-info mr-1"></i> Nhập cột A vào ô "Câu hỏi", cột B vào ô "Đáp án đúng". Các phương án nhiễu nhập vào ô Option.
                </div>
                <div class="flex justify-between items-center mb-2">
                     <label class="block text-xs font-bold text-gray-500 uppercase">Các cặp nối</label>
                     <button onclick="addQuestion(${section.id})" class="text-xs bg-orange-600 text-white px-3 py-1 rounded font-bold">+ Thêm cặp</button>
                </div>
                <div id="questions-container-${section.id}" class="space-y-3"></div>
             `;
        }

        html += `</div></div>`; // Đóng Section
        container.innerHTML += html;

        // --- GỌI HÀM RENDER CON ---
        if (section.type === 'gap_fill') {
            window.handleGapInput(section.id, section.content);
        } else if (['reading', 'multiple_choice', 'listening', 'matching'].includes(section.type)) {
            window.renderQuestions(section.id);
        }
    });
}

// --- 3. CÁC HÀM XỬ LÝ LOGIC CON ---

// Update Data Helper
window.updateSectionData = (id, key, val) => { window.examData.sections.find(s => s.id === id)[key] = val; }

// --- LOGIC: GAP FILL ---
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
            <div class="bg-white p-2 mb-2 rounded border shadow-sm text-xs">
                <span class="font-bold text-purple-700 bg-purple-50 px-1 rounded">{${gapName}}</span>
                <div class="grid grid-cols-2 gap-1 mt-1">
                    ${[0,1,2,3].map(i => `<input class="border rounded px-1 py-1" placeholder="Op ${i+1}" value="${q.options[i]}" onchange="updateGapOption(${sectionId}, '${gapName}', ${i}, this.value)">`).join('')}
                </div>
                <select class="mt-1 border rounded w-full py-1" onchange="updateGapAnswer(${sectionId}, '${gapName}', this.value)">
                    <option value="">Chọn đáp án...</option>
                    ${[0,1,2,3].map(i => `<option value="${i}" ${q.answer === q.options[i] && q.answer!="" ? 'selected':''}>Option ${i+1}</option>`).join('')}
                </select>
            </div>
        `;
    });
    container.innerHTML = html || '<p class="text-gray-400 text-xs italic">Chưa tìm thấy {gap}...</p>';
}
window.updateGapOption = (secId, gapId, idx, val) => { window.examData.sections.find(s => s.id === secId).questions.find(q => q.id === gapId).options[idx] = val; }
window.updateGapAnswer = (secId, gapId, idx) => { 
    const q = window.examData.sections.find(s => s.id === secId).questions.find(item => item.id === gapId);
    if(q && idx!=="") q.answer = q.options[parseInt(idx)];
}

// --- LOGIC: QUESTIONS (Reading, Listening, MCQ...) ---
window.addQuestion = (secId) => {
    const s = window.examData.sections.find(i => i.id === secId);
    // Tạo cấu trúc câu hỏi chuẩn
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
        let optionsHtml = '';
        
        // Nếu là Matching thì giao diện khác một chút (Input A nối Input B)
        if (section.type === 'matching') {
            optionsHtml = `
                <div class="grid grid-cols-2 gap-2 mt-2">
                    <input class="border rounded px-2 py-1 text-xs" placeholder="Cột A (Đề)" value="${q.question_text}" onchange="updateNormalQ(${secId}, ${idx}, 'text', this.value)">
                    <input class="border rounded px-2 py-1 text-xs font-bold text-blue-700" placeholder="Cột B (Đáp án đúng)" value="${q.answer}" onchange="updateNormalQ(${secId}, ${idx}, 'ans', this.value)">
                </div>
            `;
        } else {
            // Giao diện trắc nghiệm 4 đáp án thông thường
            optionsHtml = `
                <div class="mb-1"><input class="border-b w-full text-sm py-1 outline-none" placeholder="Nội dung câu hỏi..." value="${q.question_text}" onchange="updateNormalQ(${secId}, ${idx}, 'text', this.value)"></div>
                <div class="grid grid-cols-2 gap-x-4 gap-y-2">
                     ${[0,1,2,3].map(i => `
                        <div class="flex items-center gap-1 group">
                            <input type="radio" name="r-${section.id}-${q.id}" ${q.answer === ['A','B','C','D'][i] ? 'checked':''} onchange="updateNormalQ(${secId}, ${idx}, 'ans', '${['A','B','C','D'][i]}')">
                            <span class="text-xs font-bold text-gray-400 w-3">${['A','B','C','D'][i]}</span>
                            <input class="border rounded w-full text-xs py-1 px-2 group-hover:border-blue-400" value="${q.options[i]}" onchange="updateNormalQ(${secId}, ${idx}, 'opt-${i}', this.value)">
                        </div>
                     `).join('')}
                </div>
            `;
        }

        html += `
            <div class="bg-white border p-3 rounded relative hover:shadow-sm transition">
                <span class="absolute top-2 right-2 text-xs text-gray-300 hover:text-red-500 cursor-pointer" onclick="removeQuestion(${secId}, ${idx})"><i class="fa-solid fa-times"></i></span>
                <span class="text-xs font-bold text-gray-400 bg-gray-100 px-1 rounded mr-2">Q${idx+1}</span>
                ${optionsHtml}
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

// --- SAVE / UPDATE ---
window.saveExam = async function() {
    const title = document.getElementById('exam-title').value;
    if(!title) return alert("Vui lòng nhập tên đề thi!");
    
    // Cập nhật thông tin Header
    window.examData.title = title;
    window.examData.duration = parseInt(document.getElementById('exam-duration').value) || 60;
    window.examData.category = document.getElementById('exam-category').value;
    window.examData.lastModified = new Date().toISOString();

    try {
        if (editingExamId) {
            // Sửa đề cũ
            await updateDoc(doc(db, "exams", editingExamId), window.examData);
            alert("Cập nhật thành công!");
        } else {
            // Tạo đề mới
            window.examData.createdAt = new Date().toISOString();
            await addDoc(collection(db, "exams"), window.examData);
            alert("Lưu đề mới thành công!");
        }
        window.location.href = "library.html";
    } catch (e) {
        console.error(e);
        alert("Lỗi khi lưu: " + e.message);
    }
}
