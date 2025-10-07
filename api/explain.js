export default async function handler(req, res) {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ answer: "⚠️ Vui lòng nhập câu hỏi!" });
    }

    // Danh sách model dự phòng
    const models = ["llama3-8b-8192", "llama3-70b-8192", "llama3-8b-instant"];
    let answer = null;

    for (const model of models) {
      try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: "system",
                content:
                  "Bạn là trợ lý AI trong phòng thí nghiệm Study Lab, chuyên giải thích thí nghiệm Lý, Hóa, Sinh một cách ngắn gọn, dễ hiểu, thân thiện với học sinh.",
              },
              { role: "user", content: question },
            ],
            max_tokens: 250,
            temperature: 0.7,
          }),
        });

        const data = await response.json();

        if (data?.choices?.[0]?.message?.content) {
          answer = data.choices[0].message.content;
          break; // ✅ Thành công thì dừng lại
        }

        console.warn(`⚠️ Model ${model} bị lỗi hoặc quá tải.`);
      } catch (e) {
        console.warn(`❌ Lỗi khi gọi model ${model}:`, e);
      }
    }

    if (!answer) {
      return res.status(500).json({
        answer: "⚠️ Tất cả máy chủ AI hiện đang quá tải, vui lòng thử lại sau vài phút.",
      });
    }

    res.status(200).json({ answer });
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({
      answer:
        "⚠️ Lỗi máy chủ — không thể kết nối với AI.",
    });
  }
}
