export type SectionType = 'MATERIAL' | 'QUESTION_GROUP';

// Dạng 1: Ngữ liệu (Bài đọc / File nghe)
export interface MaterialSection {
  id: string;
  kind: 'MATERIAL';
  title?: string; // Tiêu đề nhỏ (Optional)
  content_text?: string; // HTML hoặc text bài đọc
  image_url?: string;
  audio_url?: string;
}

// Dạng 2: Nhóm câu hỏi
export interface QuestionGroupSection {
  id: string;
  kind: 'QUESTION_GROUP';
  instruction: string; // VD: "Điền vào chỗ trống"
  question_type: 'GAP_FILL' | 'MULTIPLE_CHOICE' | 'MATCHING' | 'TRUE_FALSE' | 'TABLE_COMPLETION';
  questions: SingleQuestion[];
}

export interface SingleQuestion {
  id: string;
  order_index: number;
  content: string; // Chứa {gap} nếu là điền từ
  options?: string[]; // Dùng cho trắc nghiệm A,B,C,D
  answers: string[]; // Đáp án đúng
  explanation?: string;
  score: number;
}

// Cấu trúc một đề thi hoàn chỉnh
export interface TestData {
  id?: string;
  title: string;
  type: 'IELTS_READING' | 'IELTS_LISTENING' | 'IELTS_WRITING';
  duration_minutes: number;
  sections: (MaterialSection | QuestionGroupSection)[]; // Mảng hỗn hợp
}
