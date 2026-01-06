// assets/js/exam-taker.js

let currentExam = null;
let userAnswers = {}; // Lưu đáp án: { "question_id": "answer_value" }
let timerInterval;

// 1. KHỞI TẠO
document.addEventListener('DOMContentLoaded', () => {
    // Check login
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) { window.location.href = '../auth/login.html'; return; }
    document.getElementById('student-name').innerText = user.fullname;

    // Lấy ID đề thi từ URL (vd: do-exam.html?id=123) hoặc lấy đề mới nhất để test
    const urlParams = new URLSearchParams(window.location.search);
    const examId = urlParams.get('id');

    loadExam(examId);
});

function loadExam(id) {
    const exams = JSON.parse(localStorage.getItem('exams') || "[]");
    
    // Nếu có ID thì tìm đúng ID, không thì lấy cái cuối cùng (để test cho nhanh)
    if (id) {
        currentExam = exams.find(e => e.id == id);
    } else {
        currentExam = exams[exams.length - 1]; 
    }

    if (!currentExam) {
        alert("Không tìm thấy đề thi!");
        window.location.href = "dashboard.html";
        return;
    }

    renderExamUI();
    startTimer(currentExam.duration);
}

// 2. RENDER GIAO DIỆN
function renderExamUI() {
    document.getElementById('exam-title').innerText = currentExam.title;
    const container = document.getElementById('exam-content');
    const tracker = document.getElementById('question-tracker');
    
    container.innerHTML = '';
    tracker.innerHTML = '';

    let globalQuestionIndex = 1; // Số thứ tự câu hỏi toàn bài

    currentExam.sections.forEach((section, sIndex) => {
        // Tạo HTML cho Section
        const sectionDiv = document.createElement('div');
        sectionDiv.className = "bg-white rounded-xl shadow-sm border border-gray-200 mb-8 overflow-hidden";
        
        // Header Section
        let headerHtml = `
            <div class="bg-blue-50 px-6 py-4 border-b border-blue-100">
                <h3 class="font-bold text-blue-800 uppercase text-sm">Phần ${sIndex + 1}: ${getSectionName(section.type)}</h3>
                <p class="text-gray-600 text-sm mt-1"><i class="fa-solid fa-circle-info mr-1"></i> ${section.instruction}</p>
            </div>
            <div class="p-6">
        `;

        // Body Section (Tùy loại)
        let bodyHtml = '';

        // --- A. GAP FILL ---
        if (section.type === 'gap_fill') {
            // Thay thế {gap_id} thành <select>
            let contentWithInputs = section.content.replace(/\{([^}]+)\}/g, (match, gapId) => {
                // Tìm question config tương ứng
                const q = section.questions.find(item => item.id === gapId);
                if (!q) return `<span class="text-red-500">[Lỗi cấu hình ${gapId}]</span>`;

                // Tạo tracker
                createTrackerItem(gapId, globalQuestionIndex++);

                // Tạo dropdown
                let optionsHtml = `<option value="">(${globalQuestionIndex - 1}) ...</option>`;
                q.options.forEach(opt => {
                    optionsHtml += `<option value="${opt}">${opt}</option>`;
                });

                return `
                    <select onchange="saveAnswer('${gapId}', this.value)" 
                            class="inline-block mx-1 border-b-2 border-blue-300 bg-blue-50 text-blue-900 font-bold px-2 py-1 rounded focus:outline-none focus:border-blue-600 transition cursor-pointer min-w-[100px]">
                        ${optionsHtml}
                    </select>
                `;
            });

            bodyHtml = `<div class="leading-loose text-lg text-gray-800 text-justify font-inter">${contentWithInputs}</div>`;
        }

        // --- B. READING ---
        else if (section.type === 'reading') {
            let questionsHtml = '';
            section.questions.forEach((q, qIdx) => {
                createTrackerItem(q.id, globalQuestionIndex); // Tạo tracker
                questionsHtml += renderMultipleChoiceItem(q, globalQuestionIndex++);
            });

            bodyHtml = `
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[80vh]">
                    <div class="overflow-y-auto custom-scroll pr-4 border-r border-gray-200">
                        <div class="prose max-w-none text-gray-800 bg-gray-50 p-4 rounded-lg leading-relaxed text-justify">
                            ${section.content.replace(/\n/g, '<br>')}
                        </div>
                    </div>
                    <div class="overflow-y-auto custom-scroll pl-2 space-y-6">
                        ${questionsHtml}
                    </div>
                </div>
            `;
        }

        // --- C. MULTIPLE CHOICE ---
        else {
            section.questions.forEach((q) => {
                createTrackerItem(q.id, globalQuestionIndex); // Tạo tracker
                bodyHtml += renderMultipleChoiceItem(q, globalQuestionIndex++);
            });
            bodyHtml = `<div class="space-y-6">${bodyHtml}</div>`;
        }

        sectionDiv.innerHTML = headerHtml + bodyHtml + '</div></div>';
        container.appendChild(sectionDiv);
    });
}

// Helper: Render câu hỏi trắc nghiệm
function renderMultipleChoiceItem(q, index) {
    return `
        <div class="mb-6 p-4 rounded-lg hover:bg-gray-50 transition border border-transparent hover:border-gray-200" id="q-box-${q.id}">
            <p class="font-bold text-gray-800 mb-3 flex gap-2">
                <span class="bg-blue-100 text-blue-600 px-2 py-0.5 rounded text-sm h-fit whitespace-nowrap">Câu ${index}</span>
                <span>${q.question_text}</span>
            </p>
            <div class="space-y-2 pl-2">
                ${q.options.map((opt, i) => `
                    <label class="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition group">
                        <input type="radio" name="q-${q.id}" value="${opt}" 
                               onchange="saveAnswer('${q.id}', this.value)"
                               class="w-4 h-4 text-blue-600 focus:ring-blue-500">
                        <span class="text-gray-700 group-hover:text-blue-700">${['A','B','C','D'][i]}. ${opt}</span>
                    </label>
                `).join('')}
            </div>
        </div>
    `;
}

// Helper: Tạo ô số trên thanh Tracker
function createTrackerItem(qId, index) {
    const tracker = document.getElementById('question-tracker');
    const btn = document.createElement('button');
    btn.className = "flex-shrink-0 w-10 h-10 rounded-lg border border-gray-300 bg-white text-gray-500 font-bold text-sm hover:border-blue-500 hover:text-blue-600 transition flex items-center justify-center";
    btn.id = `track-${qId}`;
    btn.innerText = index;
    btn.onclick = () => {
        // Scroll tới câu hỏi (Logic đơn giản)
        // document.getElementById(`q-box-${qId}`).scrollIntoView({behavior: "smooth"}); 
    };
    tracker.appendChild(btn);
}

function getSectionName(type) {
    if(type === 'gap_fill') return 'Điền từ';
    if(type === 'reading') return 'Đọc hiểu';
    return 'Trắc nghiệm';
}

// 3. LOGIC TƯƠNG TÁC
function saveAnswer(questionId, value) {
    userAnswers[questionId] = value;
    
    // Update visual tracker (Đổi màu xanh khi đã làm)
    const trackerBtn = document.getElementById(`track-${questionId}`);
    if (trackerBtn) {
        if (value) {
            trackerBtn.className = "flex-shrink-0 w-10 h-10 rounded-lg bg-blue-600 border border-blue-600 text-white font-bold text-sm shadow-md transition flex items-center justify-center";
        } else {
            // Revert nếu bỏ chọn (đối với dropdown chọn về rỗng)
            trackerBtn.className = "flex-shrink-0 w-10 h-10 rounded-lg border border-gray-300 bg-white text-gray-500 font-bold text-sm hover:border-blue-500 hover:text-blue-600 transition flex items-center justify-center";
        }
    }
}

function startTimer(minutes) {
    let time = minutes * 60;
    const display = document.getElementById('countdown');
    
    timerInterval = setInterval(() => {
        const m = Math.floor(time / 60);
        const s = time % 60;
        display.innerText = `${m < 10 ? '0'+m : m}:${s < 10 ? '0'+s : s}`;
        
        if (time <= 300) display.classList.add('text-red-600', 'animate-pulse'); // 5 phút cuối báo đỏ

        if (time <= 0) {
            clearInterval(timerInterval);
            alert("Hết giờ làm bài!");
            submitExam(true); // Auto submit
        }
        time--;
    }, 1000);
}

// 4. NỘP BÀI & CHẤM ĐIỂM
function submitExam(force = false) {
    if (!force && !confirm("Bạn có chắc chắn muốn nộp bài?")) return;

    clearInterval(timerInterval);

    // Tính điểm
    let correctCount = 0;
    let totalQuestions = 0;

    currentExam.sections.forEach(sec => {
        sec.questions.forEach(q => {
            totalQuestions++;
            if (userAnswers[q.id] === q.answer) {
                correctCount++;
            }
        });
    });

    const score = (correctCount / totalQuestions) * 10;
    const finalScore = Math.round(score * 10) / 10; // Làm tròn 1 chữ số thập phân

    // Lưu kết quả vào localStorage History
    const result = {
        examId: currentExam.id,
        examTitle: currentExam.title,
        date: new Date().toISOString(),
        score: finalScore,
        correct: correctCount,
        total: totalQuestions,
        answers: userAnswers // Lưu lại để xem chi tiết
    };

    const history = JSON.parse(localStorage.getItem('examHistory') || "[]");
    history.push(result);
    localStorage.setItem('examHistory', JSON.stringify(history));

    alert(`Bạn đã hoàn thành bài thi!\nĐiểm số: ${finalScore}/10 (${correctCount}/${totalQuestions} câu đúng)`);
    
    // Chuyển hướng về Dashboard (hoặc trang xem kết quả nếu làm sau)
    window.location.href = "dashboard.html";
}
