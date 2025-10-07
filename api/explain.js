export default async function handler(req, res) {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ answer: "⚠️ Vui lòng nhập câu hỏi!" });
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [
          {
            role: "system",
            content:
              "Bạn là trợ lý AI trong phòng thí nghiệm Study Lab, chuyên giải thích thí nghiệm Lý, Hóa, Sinh một cách ngắn gọn, dễ hiểu, thân thiện với học sinh."
          },
          {
            role: "user",
            content: question
          }
        ],
        max_tokens: 250,
        temperature: 0.7
      })
    });

    const data = await response.json();

    // 🧠 Nếu API trả về lỗi
    if (data.error) {
      console.error("Groq API Error:", data.error);
      return res.status(500).json({
        answer: "⚠️ Máy chủ AI đang tạm quá tải, vui lòng thử lại sau vài phút."
      });
    }

    const answer = data.choices?.[0]?.message?.content || "🤖 Xin lỗi, mình chưa hiểu câu hỏi của bạn.";
    res.status(200).json({ answer });
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({
      answer: "⚠️ Lỗi máy chủ — không thể kết nối với AI. Vui lòng kiểm tra lại API key hoặc mạng."
    });
  }
}
