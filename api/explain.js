export default async function handler(req, res) {
  const { question } = req.body;

  // Gọi OpenAI API (hoặc model khác)
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Bạn là trợ lý AI giải thích các thí nghiệm vật lí, hoá học, sinh học một cách dễ hiểu." },
        { role: "user", content: question }
      ]
    })
  });

  const data = await response.json();
  res.status(200).json({ answer: data.choices[0].message.content });
}
