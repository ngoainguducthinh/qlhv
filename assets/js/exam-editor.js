// assets/js/exam-editor.js

// BIẾN LƯU TRỮ CẤU TRÚC ĐỀ THI
let examData = {
    title: "",
    duration: 60,
    category: "",
    sections: [] 
};

// --- 1. QUẢN LÝ SECTION (THÊM/XÓA) ---

function addSection(type) {
    // Ẩn thông báo rỗng
    document.getElementById('empty-state').style.display = 'none';

    let newSection = {
        id: Date.now(), // ID duy nhất
        type: type,
        instruction: "",
        content: "",
        questions: []
    };

    // Tạo dữ liệu mẫu cho người dùng dễ hiểu
    if (type === 'multiple_choice') {
        newSection.instruction = "Chọn đáp án đúng nhất cho các câu hỏi sau.";
    } else if (type === 'gap_fill') {
        newSection.instruction = "Đọc đoạn văn và chọn từ thích hợp điền vào chỗ trống.";
        newSection.content = "EduManager is a powerful tool {for} education. It helps {manage} students effectively."; 
    } else if (type === 'reading') {
        newSection.instruction = "Đọc đoạn văn và trả lời các câu hỏi bên dưới.";
    }

    examData.sections.push(newSection);
    renderSections(); // Vẽ lại giao diện
}

function removeSection(sectionId) {
    if(confirm("Bạn có chắc muốn xóa phần thi này không?")) {
        examData.sections = examData.sections.filter(s => s.id !== sectionId);
        renderSections();
        if(examData.sections.length === 0) document.getElementById('empty-state').style.display = 'block';
    }
}

// --- 2. RENDER GIAO DIỆN (CORE) ---

function renderSections() {
    const container = document.getElementById('sections-container');
    container.innerHTML = ''; // Clear cũ

    if (examData.sections.length === 0) {
        document.getElementById('empty-state').style.display = 'block';
        return;
    }

    examData.sections.forEach((section, index) => {
        let html = '';
        const sectionTitle = `Phần ${index + 1}: ${getSectionTypeName(section.type)}`;

        html += `
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group" id="sec-${section.id}">
                <div class="bg-gray-50 px-6 py-3 border-b border-gray-200 flex justify-between items-center">
                    <h3 class="font-bold text-gray-700 text-lg">${sectionTitle}</h3>
                    <button onclick="removeSection(${section.id})" class="text-gray-400 hover:text-red-600 transition">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
                
                <div class="p-6 space-y-4">
                    <div>
                        <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Yêu cầu đề bài</label>
                        <input type="text" 
                            class="w-full border rounded px-3 py-2 text-sm outline-none focus:border-blue-500 bg-gray-50 focus:bg-white transition" 
                            value="${section.instruction}"
                            onchange="updateSectionData(${section.id}, 'instruction', this.value)"
                            placeholder="Nhập hướng dẫn làm bài...">
                    </div>
        `;

        // RENDER THEO LOẠI
        
        // A. DẠNG ĐIỀN TỪ (GAP FILL)
        if (section.type === 'gap_fill') {
            html += `
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-xs font-bold text-gray-500 uppercase mb-1 flex justify-between">
                            <span>Đoạn văn nguồn</span>
                            <span class="text-blue-600 normal-case font-normal text-[10px] bg-blue-50 px-2 py-0.5 rounded">Dùng {tu_khoa} để tạo ô trống</span>
                        </label>
                        <textarea 
                            class="w-full h-80 border rounded p-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none font-mono leading-relaxed"
                            oninput="handleGapInput(${section.id}, this.value)">${section.content}</textarea>
                    </div>
                    <div class="bg-purple-50 p-4 rounded-lg border border-purple-100 flex flex-col h-80">
                        <label class="block text-xs font-bold text-purple-800 uppercase mb-3 flex items-center gap-2">
                            <i class="fa-solid fa-gears"></i> Cấu hình đáp án
                        </label>
                        <div id="gap-config-${section.id}" class="flex-1 overflow-y-auto custom-scroll pr-2 space-y-3">
                            </div>
                    </div>
                </div>
            `;
        }

        // B. DẠNG ĐỌC HIỂU (READING)
        else if (section.type === 'reading') {
            html += `
                 <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div class="lg:col-span-7">
                        <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Nội dung bài đọc (Passage)</label>
                        <textarea 
                            class="w-full h-96 border rounded p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed"
                            onchange="updateSectionData(${section.id}, 'content', this.value)"
                            placeholder="Paste đoạn văn vào đây...">${section.content || ''}</textarea>
                    </div>
                    <div class="lg:col-span-5 flex flex-col h-96">
                         <div class="flex justify-between items-center mb-2">
                            <label class="block text-xs font-bold text-gray-500 uppercase">Danh sách câu hỏi</label>
                            <button onclick="addQuestionToSection(${section.id})" class="text-xs bg-blue-600 text-white px-3 py-1 rounded font-bold hover:bg-blue-700 shadow">+ Thêm câu</button>
                        </div>
                        <div id="questions-container-${section.id}" class="flex-1 overflow-y-auto border rounded bg-gray-50 p-3 space-y-3 custom-scroll">
                            </div>
                    </div>
                </div>
            `;
        }

        // C. DẠNG TRẮC NGHIỆM ĐƠN (MULTIPLE CHOICE)
        else if (section.type === 'multiple_choice') {
            html += `
                <div>
                     <div class="flex justify-between items-center mb-2">
                        <label class="block text-xs font-bold text-gray-500 uppercase">Danh sách câu hỏi</label>
                        <button onclick="addQuestionToSection(${section.id})" class="text-xs bg-green-600 text-white px-3 py-1 rounded font-bold hover:bg-green-700 shadow">+ Thêm câu</button>
                    </div>
                    <div id="questions-container-${section.id}" class="space-y-4">
                        </div>
                </div>
            `;
        }

        html += `</div></div>`;
        container.innerHTML += html;

        // Sau khi vẽ khung, gọi hàm vẽ chi tiết con
        if (section.type !== 'gap_fill') {
            renderQuestions(section.id);
        } else {
            handleGapInput(section.id, section.content); // Trigger logic gap
        }
    });
}

// --- 3. HELPERS & LOGIC UPDATE ---

function getSectionTypeName(type) {
    if(type === 'gap_fill') return 'Đọc - Điền từ (Cloze Test)';
    if(type === 'reading') return 'Đọc Hiểu (Reading Comprehension)';
    return 'Trắc nghiệm (Multiple Choice)';
}

function updateSectionData(id, key, value) {
    const section = examData.sections.find(s => s.id === id);
    if (section) section[key] = value;
}

// --- 4. LOGIC GAP FILL (TỰ ĐỘNG PARSE {gap}) ---

function handleGapInput(sectionId, text) {
    // Lưu content
    updateSectionData(sectionId, 'content', text);

    // Regex tìm {...}
    const regex = /\{([^}]+)\}/g;
    let match;
    const gaps = [];
    while ((match = regex.exec(text)) !== null) {
        gaps.push(match[1]); // Lấy tên trong ngoặc
    }

    const configContainer = document.getElementById(`gap-config-${sectionId}`);
    if (!configContainer) return;

    if (gaps.length === 0) {
        configContainer.innerHTML = '<div class="text-center text-gray-400 mt-10"><i class="fa-solid fa-magnifying-glass mb-2"></i><p class="text-xs">Chưa tìm thấy mã {gap} nào trong đoạn văn.</p></div>';
        return;
    }

    const section = examData.sections.find(s => s.id === sectionId);
    let html = '';

    gaps.forEach((gapName, index) => {
        // Tìm xem gap này đã có data cũ chưa
        let q = section.questions.find(item => item.id === gapName);
        
        // Nếu chưa có -> Tạo mới
        if (!q) {
            q = { id: gapName, options: ["", "", "", ""], answer: "" };
            // Note: Ở đây ta chỉ tạo object tạm để render, việc sync mảng questions chuẩn sẽ làm khi save hoặc change
            section.questions.push(q);
        }

        html += `
            <div class="bg-white p-3 rounded border border-purple-200 shadow-sm">
                <div class="flex justify-between items-center mb-2 border-b border-purple-50 pb-1">
                    <div class="flex items-center gap-2">
                        <span class="bg-purple-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded min-w-[24px] text-center">${index + 1}</span>
                        <span class="text-sm font-bold text-gray-700">{${gapName}}</span>
                    </div>
                    <div class="flex items-center gap-1">
                        <span class="text-[10px] text-gray-500 uppercase font-bold">Đáp án:</span>
                        <select class="border rounded text-xs py-0.5 px-1 bg-purple-50 focus:ring-1 focus:ring-purple-500 outline-none" 
                                onchange="updateGapAnswer(${sectionId}, '${gapName}', this.value)">
                            <option value="">Chọn</option>
                            <option value="0" ${q.answer === q.options[0] && q.answer !== "" ? 'selected' : ''}>A</option>
                            <option value="1" ${q.answer === q.options[1] && q.answer !== "" ? 'selected' : ''}>B</option>
                            <option value="2" ${q.answer === q.options[2] && q.answer !== "" ? 'selected' : ''}>C</option>
                            <option value="3" ${q.answer === q.options[3] && q.answer !== "" ? 'selected' : ''}>D</option>
                        </select>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-2">
                    ${[0,1,2,3].map(i => `
                        <div class="flex items-center">
                            <span class="text-[10px] text-gray-400 w-4 font-bold">${['A','B','C','D'][i]}</span>
                            <input type="text" class="border rounded px-2 py-1 text-xs w-full focus:border-purple-500 outline-none" 
                                   placeholder="Option ${['A','B','C','D'][i]}"
                                   value="${q.options[i] || ''}"
                                   onchange="updateGapOption(${sectionId}, '${gapName}', ${i}, this.value)">
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });
    configContainer.innerHTML = html;
}

function updateGapOption(secId, gapId, optIndex, val) {
    const section = examData.sections.find(s => s.id === secId);
    let q = section.questions.find(item => item.id === gapId);
    if(q) q.options[optIndex] = val;
}

function updateGapAnswer(secId, gapId, optIndexVal) {
    const section = examData.sections.find(s => s.id === secId);
    let q = section.questions.find(item => item.id === gapId);
    if(q && optIndexVal !== "") {
        q.answer = q.options[parseInt(optIndexVal)]; // Lưu text đáp án đúng
    }
}

// --- 5. LOGIC READING & MULTIPLE CHOICE ---

function addQuestionToSection(sectionId) {
    const section = examData.sections.find(s => s.id === sectionId);
    section.questions.push({
        id: Date.now(),
        question_text: "",
        options: ["", "", "", ""],
        answer: "A"
    });
    renderQuestions(sectionId);
}

function removeQuestionFromSection(sectionId, qIndex) {
    const section = examData.sections.find(s => s.id === sectionId);
    section.questions.splice(qIndex, 1);
    renderQuestions(sectionId);
}

function renderQuestions(sectionId) {
    const container = document.getElementById(`questions-container-${sectionId}`);
    if (!container) return;
    
    const section = examData.sections.find(s => s.id === sectionId);
    let html = '';

    section.questions.forEach((q, idx) => {
        html += `
            <div class="bg-white p-3 rounded border border-gray-200 shadow-sm text-sm relative group/q hover:border-blue-300 transition">
                <button onclick="removeQuestionFromSection(${sectionId}, ${idx})" class="absolute top-2 right-2 text-gray-300 hover:text-red-500"><i class="fa-solid fa-times"></i></button>
                
                <div class="mb-3 pr-6">
                    <span class="font-bold text-blue-600 mr-1">Q${idx + 1}.</span>
                    <input type="text" class="border-b border-dashed border-gray-300 w-[90%] outline-none focus:border-blue-500 py-1 bg-transparent placeholder-gray-400" 
                           placeholder="Nhập nội dung câu hỏi..." 
                           value="${q.question_text}"
                           onchange="updateNormalQuestion(${sectionId}, ${idx}, 'text', this.value)">
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                    ${[0, 1, 2, 3].map(optIdx => `
                        <div class="flex items-center gap-2 group/opt">
                            <input type="radio" name="radiogroup-${sectionId}-${q.id}" 
                                   class="cursor-pointer text-blue-600"
                                   ${q.answer === ['A','B','C','D'][optIdx] ? 'checked' : ''}
                                   onchange="updateNormalQuestion(${sectionId}, ${idx}, 'answer', '${['A','B','C','D'][optIdx]}')">
                            <span class="text-xs font-bold text-gray-400 w-3 group-hover/opt:text-blue-500">${['A','B','C','D'][optIdx]}</span>
                            <input type="text" class="border rounded px-2 py-1.5 w-full text-xs focus:border-blue-500 outline-none" 
                                   placeholder="Phương án ${['A','B','C','D'][optIdx]}"
                                   value="${q.options[optIdx]}"
                                   onchange="updateNormalQuestion(${sectionId}, ${idx}, 'option-${optIdx}', this.value)">
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function updateNormalQuestion(secId, qIdx, field, val) {
    const section = examData.sections.find(s => s.id === secId);
    const q = section.questions[qIdx];
    
    if (field === 'text') q.question_text = val;
    else if (field === 'answer') q.answer = val;
    else if (field.startsWith('option-')) {
        const optIdx = parseInt(field.split('-')[1]);
        q.options[optIdx] = val;
    }
}

// --- 6. JSON & SAVE ---

function toggleJsonMode() {
    const container = document.getElementById('json-mode-container');
    const input = document.getElementById('json-input');
    
    if (container.classList.contains('hidden')) {
        // Trước khi hiện JSON, cập nhật lại Header vào biến examData
        examData.title = document.getElementById('exam-title').value;
        examData.duration = document.getElementById('exam-duration').value;
        examData.category = document.getElementById('exam-category').value;
        
        input.value = JSON.stringify(examData, null, 4);
        container.classList.remove('hidden');
    } else {
        container.classList.add('hidden');
    }
}

function applyJson() {
    const input = document.getElementById('json-input');
    try {
        const parsed = JSON.parse(input.value);
        examData = parsed;
        
        document.getElementById('exam-title').value = examData.title || "";
        document.getElementById('exam-duration').value = examData.duration || 60;
        document.getElementById('exam-category').value = examData.category || "";
        
        renderSections();
        document.getElementById('json-mode-container').classList.add('hidden');
        alert("Đã cập nhật cấu trúc đề thi!");
    } catch (e) {
        alert("Lỗi JSON: " + e.message);
    }
}

function saveExam() {
    // 1. Validate
    const title = document.getElementById('exam-title').value;
    if(!title) { alert("Vui lòng nhập tên đề thi!"); return; }
    if(examData.sections.length === 0) { alert("Đề thi chưa có câu hỏi nào!"); return; }

    // 2. Final Update
    examData.title = title;
    examData.duration = document.getElementById('exam-duration').value;
    examData.category = document.getElementById('exam-category').value;
    examData.lastModified = new Date().toISOString();
    examData.id = Date.now(); // Tạo ID mới (hoặc giữ ID cũ nếu logic sửa)

    // 3. Save to LocalStorage
    // Lấy mảng đề cũ ra
    let dbExams = JSON.parse(localStorage.getItem('exams') || "[]");
    dbExams.push(examData);
    localStorage.setItem('exams', JSON.stringify(dbExams));

    alert("Lưu đề thi thành công!");
    window.location.href = "dashboard.html"; // Quay về trang chủ
}
