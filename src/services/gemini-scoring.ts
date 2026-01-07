import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

export async function scoreWritingSubmission(topic, studentEssay) {
  if (!API_KEY) throw new Error("Chưa cấu hình API Key");

  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    // Config bắt buộc trả về JSON để không bị lỗi parse
    generationConfig: { responseMimeType: "application/json" } 
  });

  const prompt = `
    You are an IELTS Examiner. Grade this essay.
    
    TOPIC: "${topic}"
    ESSAY: "${studentEssay}"
    
    Output strictly in JSON format with this schema:
    {
      "band_score": number,
      "feedback": string,
      "detailed_scores": {
        "TR": number, "CC": number, "LR": number, "GRA": number
      },
      "inline_corrections": [
        {
          "original_text": "string (exact phrase from essay)",
          "suggestion": "string",
          "type": "grammar" | "vocab" | "coherence",
          "explanation": "string"
        }
      ]
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    return JSON.parse(responseText);
  } catch (error) {
    console.error("Lỗi khi chấm bài:", error);
    return null;
  }
}
