export default async function handler(req, res) {
  // Get the conversation history from frontend JS
  const { messages } = req.body;
  
  // Grab the key from vercel's environment settings
  const API_KEY = process.env.GROQ_API_KEY; 

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
  res.status(200).json(data);
}
