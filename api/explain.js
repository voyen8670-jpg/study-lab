export default async function handler(req, res) {
  try {
    const { question } = req.body;

    // 🧠 Gọi API GPT
    const reply = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "Bạn là trợ lý AI giải thích thí nghiệm vật lí, hoá học, sinh học một cách dễ hiểu và ngắn gọn." },
          { role: "user", content: question }
        ]
      })
    });

    const data = await reply.json();

    // ✅ Trả đúng dạng cho client
    const answer = data.choices?.[0]?.message?.content || "Xin lỗi, mình chưa hiểu câu hỏi.";
    res.status(200).json({ answer });

  } catch (err) {
    console.error("❌ Lỗi server:", err);
    res.status(500).json({ answer: "⚠️ Lỗi khi gọi AI, vui lòng thử lại sau." });
  }
}
