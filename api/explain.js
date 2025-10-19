export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Chỉ chấp nhận POST" });
  }

  const { question } = req.body;

  try {
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "mistral",
        prompt: question,
        stream: false,
      }),
    });

    const data = await response.json();
    res.status(200).json({ answer: data.response });
  } catch (err) {
    console.error("❌ Lỗi kết nối Ollama:", err);
    res.status(500).json({ error: "Không kết nối được tới Ollama." });
  }
}
