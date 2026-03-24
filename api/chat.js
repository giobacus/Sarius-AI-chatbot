export default async function handler(req, res) {
  const { messages } = req.body;
  const API_KEY = process.env.GROQ_API_KEY;

  // Get latest user message
  const lastUserMessage = messages
    .slice()
    .reverse()
    .find(msg => msg.role === "user");

  // Detect if image exists
  let hasImage = false;

  if (Array.isArray(lastUserMessage?.content)) {
    hasImage = lastUserMessage.content.some(
      item => item.type === "image_url"
    );
  }

  // Log safely (no base64 spam)
  console.log("📩 User:", {
    text: lastUserMessage?.content?.find(c => c.type === "text")?.text || "",
    image: hasImage
  });
  
  // Get bot answer
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: messages,
      temperature: 0.5,
      max_tokens: 800
    })
  });

  const data = await response.json();

  const botReply = data?.choices?.[0]?.message?.content;

  console.log("Bot:", botReply);

  res.status(200).json(data);
}