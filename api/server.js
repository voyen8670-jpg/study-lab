import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// 📡 Endpoint nhận câu hỏi và gọi Ollama
app.post("/api/ask", async (req, res) => {
  const question = req.body.question;
  try {
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemma:2b",
        prompt: question
      })
    });

    const data = await response.json();
    res.json({ answer: data.response });
  } catch (err) {
    res.status(500).json({ error: "Lỗi kết nối Ollama" });
  }
});

app.listen(3000, () => console.log("🚀 Server đang chạy ở http://localhost:3000"));
