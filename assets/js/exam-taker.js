import { db, doc, getDoc, addDoc, collection } from './firebase-init.js';

let currentExam = null;
let userAnswers = {}; // Lưu đáp án: { questionId: "answer" }
let questionMap = []; // Map để track index câu hỏi
let timerInterval;

document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) { window.location.href = '../auth/login.html'; return; }
    document.getElementById('student-name').innerText = user.fullname;

    const urlParams = new URLSearchParams(window.location.search);
    const examId = urlParams.get('id');
    document.getElementById('exam-id-display').innerText = examId ? '#' + examId.slice(-6) : '---';

    if(examId) loadExam(examId);
    else alert("Không tìm thấy đề thi!");
});

async function loadExam(id) {
    try {
        const docSnap = await getDoc(doc(db, "exams", id));
        if (docSnap.exists()) {
            currentExam = { id: docSnap.id, ...docSnap.data() };
            renderExamUI();
            startTimer(currentExam.duration);
        } else {
            alert("Đề thi không tồn tại hoặc đã bị xóa!");
            window.location.href = "dashboard.html";
        }
    } catch (e) {
        console.error(e);
        alert("Lỗi tải đề: " + e.message);
    }
}

// --- RENDER GIAO DIỆN CHÍNH ---
function renderExamUI() {
    document.getElementById('exam-title').innerText = currentExam.title;
    const container = document.getElementById('exam-content');
    const tracker = document.getElementById('question-tracker');
    container.innerHTML = ''; tracker.innerHTML = '';
    
    let globalQIndex = 1; // Số thứ tự câu hỏi toàn bài (1, 2, 3...)

    if (!currentExam.sections || currentExam.sections.length === 0) {
        container.innerHTML = `<div class="text-center text-red-500">Đề thi này chưa có câu hỏi nào.</div>`;
        return;
    }

    currentExam.sections.forEach((sec, sIdx) => {
        let typeName = "";
        let contentHtml = "";

        // --- XỬ LÝ TỪNG LOẠI BÀI ---
        
        // 1. GAP FILL
        if (sec.type === 'gap_fill') {
            typeName = "ĐIỀN TỪ";
            // Regex thay thế {gap} thành dropdown
            let contentText = sec.content.replace(/\{([^}]+)\}/g, (match, gapId) => {
                const q = sec.questions.find(i => i.id === gapId);
                if(!q) return `[Lỗi: ${gapId}]`;
                
                // Đăng ký câu hỏi vào Tracker
                registerQuestion(gapId, globalQIndex++);
                
                return `
                    <select class="inline-block border-b-2 border-blue-500 font-bold text-blue-800 mx-1 bg-blue-50 py-1 px-2 rounded cursor-pointer hover:bg-blue-100 transition" 
                        onchange="saveAnswer('${gapId}', this.value)">
                        <option value="">(${globalQIndex-1}) ...</option>
                        ${q.options.map(o => `<option value="${o}">${o}</option>`).join('')}
                    </select>
                `;
            });
            contentHtml = `<div class="leading-loose text-lg text-justify font-serif text-gray-800 bg-gray-50 p-6 rounded-lg border">${contentText}</div>`;
        } 

        // 2. READING (Layout 2 cột: Trái bài đọc - Phải câu hỏi)
        else if (sec.type === 'reading') {
            typeName = "ĐỌC HIỂU";
            let questionsHtml = sec.questions.map(q => renderMultipleChoice(q, globalQIndex++)).join('');
            
            contentHtml = `
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[500px]">
                    <div class="bg-gray-50 p-4 rounded-lg border overflow-y-auto leading-relaxed text-justify font-serif text-gray-800">
                        ${sec.content.replace(/\n/g, '<br>')}
                    </div>
                    <div class="overflow-y-auto pr-2 space-y-4">
                        ${questionsHtml}
                    </div>
                </div>
            `;
        }

        // 3. LISTENING
        else if (sec.type === 'listening') {
            typeName = "NGHE HIỂU";
            let audioHtml = sec.content ? `
                <div class="flex justify-center mb-6 bg-black rounded-lg p-4">
                    <audio controls class="w-full max-w-md">
                        <source src="${sec.content}" type="audio/mpeg">
                        Trình duyệt của bạn không hỗ trợ audio.
                    </audio>
                </div>` : '<div class="text-red-500 mb-4">Chưa có file nghe.</div>';
            
            let questionsHtml = sec.questions.map(q => renderMultipleChoice(q, globalQIndex++)).join('');
            contentHtml = audioHtml + `<div class="space-y-4">${questionsHtml}</div>`;
        }

        // 4. MULTIPLE CHOICE
        else if (sec.type === 'multiple_choice') {
            typeName = "TRẮC NGHIỆM";
            contentHtml = `<div class="grid grid-cols-1 md:grid-cols-2 gap-4">` + 
                          sec.questions.map(q => renderMultipleChoice(q, globalQIndex++)).join('') + 
                          `</div>`;
        }

        // 5. MATCHING (NỐI)
        else if (sec.type === 'matching') {
            typeName = "NỐI (MATCHING)";
            // Lấy tất cả đáp án đúng (Cột B) để làm options cho dropdown
            // (Trong Matching, 'answer' của mỗi câu chính là giá trị đúng ở cột B)
            const columnB_Options = sec.questions.map(q => q.answer).sort(() => Math.random() - 0.5); // Shuffle options

            contentHtml = `
                <div class="bg-orange-50 p-4 rounded mb-4 text-orange-800 text-sm">
                    <i class="fa-solid fa-circle-info"></i> Chọn đáp án tương ứng từ danh sách thả xuống để ghép với cột bên trái.
                </div>
                <div class="space-y-2">
                    ${sec.questions.map(q => {
                        registerQuestion(q.id, globalQIndex++);
                        return `
                        <div class="flex items-center gap-4 bg-white p-3 border rounded shadow-sm">
                            <div class="w-8 h-8 rounded-full bg-orange-100 text-orange-600 font-bold flex items-center justify-center shrink-0">${globalQIndex-1}</div>
                            <div class="flex-1 font-medium text-gray-800">${q.question_text}</div>
                            <div class="shrink-0"><i class="fa-solid fa-arrow-right text-gray-300"></i></div>
                            <div class="w-1/3">
                                <select class="w-full border rounded px-2 py-2 text-sm bg-gray-50 focus:bg-white focus:ring-2 ring-orange-200 outline-none" onchange="saveAnswer('${q.id}', this.value)">
                                    <option value="">-- Chọn --</option>
                                    ${columnB_Options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                                </select>
                            </div>
                        </div>`;
                    }).join('')}
                </div>
            `;
        }

        // 6. WRITING
        else if (sec.type === 'writing') {
            typeName = "VIẾT LUẬN";
            // Writing coi như 1 câu hỏi lớn
            let qId = `writing-${sec.id}`;
            registerQuestion(qId, globalQIndex++);
            
            contentHtml = `
                <div class="bg-yellow-50 p-4 rounded-lg border border-yellow-100 mb-4 text-gray-800">
                    <h4 class="font-bold mb-2 uppercase text-xs text-yellow-600">Đề bài:</h4>
                    ${sec.content.replace(/\n/g, '<br>')}
                </div>
                <textarea class="w-full h-64 p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-serif text-lg leading-relaxed" 
                    placeholder="Nhập bài làm của bạn vào đây..." 
                    oninput="saveAnswer('${qId}', this.value)"></textarea>
            `;
        }

        // RENDER SECTION CONTAINER
        container.innerHTML += `
            <div class="bg-white rounded-xl shadow-sm border mb-8 overflow-hidden">
                <div class="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
                    <h3 class="font-bold text-gray-800 uppercase text-sm"><span class="text-blue-600 mr-2">Phần ${sIdx+1}</span> ${typeName}</h3>
                    <div class="text-xs text-gray-400 bg-white px-2 py-1 rounded border shadow-sm">${sec.instruction || ''}</div>
                </div>
                <div class="p-6">${contentHtml}</div>
            </div>
        `;
    });
}

// --- HELPER: RENDER 1 CÂU TRẮC NGHIỆM ---
function renderMultipleChoice(q, idx) {
    registerQuestion(q.id, idx);
    return `
        <div class="mb-4 p-4 border rounded-lg hover:bg-blue-50/30 transition bg-white">
            <div class="flex gap-3 mb-3">
                <span class="shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center text-sm">${idx}</span>
                <p class="font-medium text-gray-800 mt-1">${q.question_text}</p>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-11">
                ${q.options.map((opt, i) => `
                    <label class="flex items-center gap-3 p-2 border rounded cursor-pointer hover:border-blue-400 hover:bg-white transition group">
                        <input type="radio" name="q-${q.id}" value="${opt}" 
                            class="w-4 h-4 text-blue-600 focus:ring-blue-500"
                            onchange="saveAnswer('${q.id}', this.value)">
                        <span class="text-sm text-gray-600 group-hover:text-blue-800"><span class="font-bold mr-1 text-gray-400">${['A','B','C','D'][i]}.</span> ${opt}</span>
                    </label>
                `).join('')}
            </div>
        </div>
    `;
}

// --- HELPER: ĐĂNG KÝ CÂU HỎI VÀO TRACKER ---
function registerQuestion(id, idx) {
    questionMap.push(id);
    const btn = document.createElement('button');
    btn.className = "w-10 h-10 rounded-lg bg-gray-100 text-gray-400 font-bold text-sm border hover:bg-gray-200 transition";
    btn.innerText = idx;
    btn.id = `track-${id}`;
    btn.onclick = () => {
        // Scroll to question (Optional logic)
    };
    document.getElementById('question-tracker').appendChild(btn);
}

// --- LOGIC LƯU ĐÁP ÁN ---
window.saveAnswer = function(qId, val) {
    userAnswers[qId] = val;
    // Update Tracker UI
    const trackerBtn = document.getElementById(`track-${qId}`);
    if (val && val.trim() !== "") {
        trackerBtn.className = "w-10 h-10 rounded-lg bg-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-200 transform scale-105 transition";
    } else {
        trackerBtn.className = "w-10 h-10 rounded-lg bg-gray-100 text-gray-400 font-bold text-sm border";
    }
    
    // Update Progress Bar
    const answeredCount = Object.keys(userAnswers).filter(k => userAnswers[k]).length;
    const total = questionMap.length;
    const percent = Math.round((answeredCount / total) * 100);
    document.getElementById('progress-bar').style.width = `${percent}%`;
    document.getElementById('progress-text').innerText = `${percent}%`;
}

// --- LOGIC ĐỒNG HỒ ---
function startTimer(min) {
    let time = min * 60;
    const display = document.getElementById('countdown');
    
    timerInterval = setInterval(() => {
        const m = Math.floor(time/60);
        const s = time%60;
        display.innerText = `${m}:${s<10?'0'+s:s}`;
        
        if (time <= 300) display.classList.add('text-red-600', 'animate-pulse'); // 5 phút cuối báo đỏ

        if(time-- <= 0) {
            clearInterval(timerInterval);
            alert("Hết giờ làm bài!");
            submitExam(true);
        }
    }, 1000);
}

// --- NỘP BÀI & CHẤM ĐIỂM ---
window.submitExam = async function(force = false) {
    if(!force && !confirm("Bạn có chắc chắn muốn nộp bài?")) return;
    clearInterval(timerInterval);

    let correct = 0, total = 0, writingPending = false;
    
    // Duyệt qua tất cả sections để chấm điểm
    currentExam.sections.forEach(s => {
        if (s.type === 'writing') {
            writingPending = true; // Có bài viết cần chấm tay
            return;
        }

        s.questions.forEach(q => {
            total++;
            // So sánh đáp án (trim để tránh lỗi khoảng trắng)
            if (userAnswers[q.id] && userAnswers[q.id].trim() === q.answer.trim()) {
                correct++;
            }
        });
    });

    let score = total > 0 ? (correct / total) * 10 : 0;
    score = Math.round(score * 10) / 10; // Làm tròn 1 chữ số

    const user = JSON.parse(localStorage.getItem('currentUser'));

    try {
        await addDoc(collection(db, "results"), {
            examId: currentExam.id,
            examTitle: currentExam.title,
            username: user.username,
            fullname: user.fullname,
            score: score,
            correct: correct,
            total: total,
            hasWriting: writingPending, // Flag để báo Admin cần chấm Writing
            submittedAt: new Date().toISOString()
        });

        let msg = `Nộp bài thành công!\nBạn trả lời đúng ${correct}/${total} câu trắc nghiệm.\nĐiểm tạm tính: ${score}`;
        if (writingPending) msg += `\n\n(Lưu ý: Phần bài viết Writing sẽ được giáo viên chấm sau).`;
        
        alert(msg);
        window.location.href = "dashboard.html";
    } catch (e) {
        console.error(e);
        alert("Lỗi lưu kết quả: " + e.message);
    }
}
