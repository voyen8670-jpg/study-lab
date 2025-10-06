export default async function handler(req, res) {
  try {
    const { question } = req.body;

    if (!question || question.trim() === "") {
      return res.status(400).json({ answer: "⚠️ Bạn chưa nhập câu hỏi." });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // ✅ Dùng model mới và nhanh hơn (hoặc gpt-3.5-turbo nếu bạn thích)
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content:
              "Bạn là trợ lý AI trong phòng thí nghiệm ảo. Hãy giải thích các thí nghiệm vật lí, hoá học và sinh học một cách ngắn gọn, dễ hiểu, thân thiện, phù hợp học sinh THPT.",
          },
          { role: "user", content: question },
        ],
      }),
    });

    const data = await response.json();
    console.log("🔍 API response:", data); // Giúp bạn xem nếu OpenAI trả về lỗi

    // ✅ Kiểm tra và lấy câu trả lời an toàn
    const answer =
      data.choices?.[0]?.message?.content?.trim() ||
      "❓ Mình chưa nhận được phản hồi từ AI. Hãy thử lại nhé.";

    res.status(200).json({ answer });
  } catch (error) {
    console.error("❌ Lỗi server:", error);
    res.status(500).json({
      answer: "⚠️ Có lỗi khi gọi AI, hãy thử lại sau một chút.",
    });
  }
}
