import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid'; // Cài npm i uuid nếu chưa có, hoặc dùng Math.random tạm
import { TestData, MaterialSection, QuestionGroupSection } from '@/types/test-structure';

export default function TestEditor() {
  const [testInfo, setTestInfo] = useState<TestData>({
    title: '',
    type: 'IELTS_READING',
    duration_minutes: 60,
    sections: []
  });

  // Hàm thêm Ngữ liệu (Reading text/Listening audio)
  const addMaterial = () => {
    const newSection: MaterialSection = {
      id: uuidv4(),
      kind: 'MATERIAL',
      content_text: '',
    };
    setTestInfo(prev => ({ ...prev, sections: [...prev.sections, newSection] }));
  };

  // Hàm thêm Nhóm câu hỏi
  const addQuestionGroup = (type: string) => {
    const newSection: QuestionGroupSection = {
      id: uuidv4(),
      kind: 'QUESTION_GROUP',
      question_type: type as any,
      instruction: 'Yêu cầu đề bài...',
      questions: [] // Bắt đầu chưa có câu hỏi nhỏ nào
    };
    setTestInfo(prev => ({ ...prev, sections: [...prev.sections, newSection] }));
  };

  // Hàm thêm câu hỏi con vào trong 1 nhóm
  const addQuestionToGroup = (sectionIndex: number) => {
    const updatedSections = [...testInfo.sections];
    const group = updatedSections[sectionIndex] as QuestionGroupSection;
    
    group.questions.push({
      id: uuidv4(),
      order_index: 0, // Logic tự tăng số thứ tự xử lý sau
      content: '',
      answers: [],
      score: 1
    });
    
    setTestInfo({ ...testInfo, sections: updatedSections });
  };

  // Hàm cập nhật nội dung từng section (Text hoặc Input)
  const updateSectionData = (index: number, field: string, value: any) => {
    const updatedSections = [...testInfo.sections];
    updatedSections[index] = { ...updatedSections[index], [field]: value };
    setTestInfo({ ...testInfo, sections: updatedSections });
  };

  // Render giao diện
  return (
    <div className="p-4 space-y-6">
      <div className="border p-4 rounded bg-white">
        <h2 className="font-bold text-xl mb-4">Thông tin đề thi</h2>
        <input 
          className="border p-2 w-full mb-2" 
          placeholder="Tên đề thi"
          value={testInfo.title}
          onChange={e => setTestInfo({...testInfo, title: e.target.value})}
        />
        <select 
          className="border p-2"
          value={testInfo.type}
          onChange={e => setTestInfo({...testInfo, type: e.target.value as any})}
        >
          <option value="IELTS_READING">Reading</option>
          <option value="IELTS_LISTENING">Listening</option>
        </select>
      </div>

      {/* Khu vực hiển thị danh sách các phần đã thêm */}
      <div className="space-y-4">
        {testInfo.sections.map((section, idx) => (
          <div key={section.id} className="border-2 border-gray-300 p-4 rounded bg-gray-50">
            
            {/* Nếu là Ngữ Liệu */}
            {section.kind === 'MATERIAL' && (
              <div>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">NGỮ LIỆU</span>
                <textarea 
                  className="w-full mt-2 p-2 border h-32"
                  placeholder="Paste nội dung bài đọc vào đây..."
                  value={section.content_text}
                  onChange={(e) => updateSectionData(idx, 'content_text', e.target.value)}
                />
                {/* Thêm input upload ảnh/audio ở đây nếu cần */}
              </div>
            )}

            {/* Nếu là Câu Hỏi */}
            {section.kind === 'QUESTION_GROUP' && (
              <div>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold">NHÓM CÂU HỎI: {section.question_type}</span>
                <input 
                  className="w-full mt-2 p-2 border"
                  placeholder="Hướng dẫn (VD: Complete the table...)"
                  value={section.instruction}
                  onChange={(e) => updateSectionData(idx, 'instruction', e.target.value)}
                />
                
                <div className="ml-4 mt-4 border-l-2 pl-4">
                   {section.questions.map((q, qIdx) => (
                     <div key={q.id} className="mb-2">
                       <p className="text-sm font-bold">Câu hỏi con {qIdx + 1}</p>
                       <input className="border w-full p-1" placeholder="Nội dung câu hỏi (dùng {gap} cho điền từ)" />
                       <input className="border w-full p-1 mt-1" placeholder="Đáp án đúng (ngăn cách bằng dấu phẩy)" />
                     </div>
                   ))}
                   <button 
                     onClick={() => addQuestionToGroup(idx)}
                     className="text-sm text-blue-600 underline mt-2"
                   >
                     + Thêm câu hỏi nhỏ
                   </button>
                </div>
              </div>
            )}

            {/* Nút xóa section này */}
            <button className="text-red-500 text-xs mt-2">Xóa phần này</button>
          </div>
        ))}
      </div>

      {/* Toolbar thêm mới (Sticky bottom) */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t p-4 flex gap-4 shadow-lg justify-center">
        <button 
          onClick={addMaterial}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Thêm Ngữ liệu (Đọc/Nghe)
        </button>
        
        <div className="relative group">
          <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            + Thêm Câu hỏi
          </button>
          {/* Dropdown menu chọn loại câu hỏi */}
          <div className="absolute bottom-full left-0 bg-white border shadow rounded hidden group-hover:block w-48 mb-1">
            <div className="p-2 hover:bg-gray-100 cursor-pointer" onClick={() => addQuestionGroup('GAP_FILL')}>Điền từ (Gap Fill)</div>
            <div className="p-2 hover:bg-gray-100 cursor-pointer" onClick={() => addQuestionGroup('MULTIPLE_CHOICE')}>Trắc nghiệm</div>
            <div className="p-2 hover:bg-gray-100 cursor-pointer" onClick={() => addQuestionGroup('TRUE_FALSE')}>True/False/NG</div>
          </div>
        </div>

        <button 
          className="bg-purple-600 text-white px-6 py-2 rounded font-bold"
          onClick={() => console.log('Lưu lên Firebase:', testInfo)}
        >
          LƯU ĐỀ THI
        </button>
      </div>
    </div>
  );
}
