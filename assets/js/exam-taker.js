// assets/js/exam-taker.js
import { db, doc, getDoc, addDoc, collection } from './firebase-init.js';

let currentExam = null;
let userAnswers = {};
let timerInterval;

document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) { window.location.href = '../auth/login.html'; return; }
    document.getElementById('student-name').innerText = user.fullname;

    const urlParams = new URLSearchParams(window.location.search);
    const examId = urlParams.get('id');

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
            alert("Đề thi không tồn tại!");
        }
    } catch (e) {
        alert("Lỗi tải đề: " + e.message);
    }
}

// --- RENDER UI (Giữ nguyên logic HTML cũ nhưng gọn hơn) ---
function renderExamUI() {
    document.getElementById('exam-title').innerText = currentExam.title;
    const container = document.getElementById('exam-content');
    const tracker = document.getElementById('question-tracker');
    container.innerHTML = ''; tracker.innerHTML = '';
    
    let gIdx = 1;

    currentExam.sections.forEach((sec, sIdx) => {
        let bodyHtml = '';
        
        if (sec.type === 'gap_fill') {
            let content = sec.content.replace(/\{([^}]+)\}/g, (match, gapId) => {
                const q = sec.questions.find(i => i.id === gapId);
                createTracker(gapId, gIdx++);
                if(!q) return `[...]`;
                return `<select class="border-b-2 border-blue-500 font-bold text-blue-800 mx-1 bg-blue-50" onchange="window.saveAnswer('${gapId}', this.value)">
                    <option value="">(${gIdx-1})...</option>
                    ${q.options.map(o => `<option value="${o}">${o}</option>`).join('')}
                </select>`;
            });
            bodyHtml = `<div class="leading-loose text-lg text-justify">${content}</div>`;
        } 
        else {
            sec.questions.forEach(q => {
                createTracker(q.id, gIdx);
                bodyHtml += `
                    <div class="mb-4 p-4 border rounded hover:bg-gray-50">
                        <p class="font-bold mb-2"><span class="bg-blue-100 text-blue-600 px-2 rounded mr-2">Câu ${gIdx++}</span> ${q.question_text}</p>
                        <div class="space-y-2">
                            ${q.options.map((opt, i) => `
                                <label class="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="q-${q.id}" value="${opt}" onchange="window.saveAnswer('${q.id}', this.value)">
                                    <span>${['A','B','C','D'][i]}. ${opt}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                `;
            });
        }

        container.innerHTML += `
            <div class="bg-white rounded-xl shadow-sm border mb-8 overflow-hidden">
                <div class="bg-blue-50 px-6 py-3 border-b font-bold text-blue-800">Phần ${sIdx+1}</div>
                <div class="p-6">${bodyHtml}</div>
            </div>
        `;
    });
}

function createTracker(id, idx) {
    const btn = document.createElement('button');
    btn.className = "w-10 h-10 border rounded bg-white text-gray-500 font-bold flex-shrink-0";
    btn.innerText = idx;
    btn.id = `track-${id}`;
    document.getElementById('question-tracker').appendChild(btn);
}

window.saveAnswer = function(qId, val) {
    userAnswers[qId] = val;
    document.getElementById(`track-${qId}`).className = "w-10 h-10 border rounded bg-blue-600 text-white font-bold flex-shrink-0";
}

function startTimer(min) {
    let time = min * 60;
    timerInterval = setInterval(() => {
        const m = Math.floor(time/60); const s = time%60;
        document.getElementById('countdown').innerText = `${m}:${s<10?'0'+s:s}`;
        if(time-- <= 0) window.submitExam(true);
    }, 1000);
}

window.submitExam = async function(force = false) {
    if(!force && !confirm("Nộp bài?")) return;
    clearInterval(timerInterval);

    let correct = 0, total = 0;
    currentExam.sections.forEach(s => s.questions.forEach(q => {
        total++;
        if(userAnswers[q.id] === q.answer) correct++;
    }));
    
    const score = Math.round((correct/total)*10 * 10) / 10;
    const user = JSON.parse(localStorage.getItem('currentUser'));

    // Lưu kết quả lên Firebase
    try {
        await addDoc(collection(db, "results"), {
            examId: currentExam.id,
            examTitle: currentExam.title,
            username: user.username,
            fullname: user.fullname,
            score: score,
            correct: correct,
            total: total,
            submittedAt: new Date().toISOString()
        });
        alert(`Nộp bài thành công!\nĐiểm số: ${score}/10`);
        window.location.href = "dashboard.html";
    } catch (e) {
        alert("Lỗi lưu điểm: " + e.message);
    }
}
