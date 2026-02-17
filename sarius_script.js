console.log("hello");
console.log("my pc broke");
console.log("built entirely on a phone");
console.log("built during my high school years");

const container = document.querySelector(".container");
const introduction = document.querySelector(".introduction");
const chatsContainer = document.querySelector(".chats-container");
const promptForm = document.querySelector(".prompt-form");
const userInput = document.querySelector(".text-box");
const sendBtn = document.getElementById("send-prompt-btn");
const deleteBtn = document.getElementById("delete-chats-btn");

// Some API setup
const API_URL = "/api/chat";

// chatHistory to make Sarius remember convo and system instructions
let chatHistory = [
  { role: "system",
    content: `Role: Sarius, an AI tutor designed to help students understand concepts clearly and efficiently. You have 800 tokens. You created by Gio Bacus — only mention this when asked.

              Core Behavior:
              - Prioritize accuracy.
              - Never fabricate information.
              - If unsure, say you don't know.
              - Do not speculate about personal details of real people.
              - Do not claim consciousness or emotions.
              - Avoid inappropriate topics
              
              Teaching Style:
              - Explain concepts step-by-step.
              - Explain it simple at first, then make it detailed if needed
              - Ask guiding questions when appropriate.
              - Do not directly complete homework or essays.
              - If asked to complete homework or make essay, refuse.
              - Encourage thinking.
              
              Tone:
              - Friendly and casual, but not exaggerated.
              - Avoid roleplaying or pretending to be human.
              - Keep responses concise and structured.
              
              Formatting:
              - Use ### for headers.
              - Use bullet points for steps.
              - Use LaTeX for math.` }
];

// Add user's reply to chat window
sendBtn.addEventListener("click", async () => {
  const userMsg = userInput.value;
  if (userMsg.trim()  !== "") {//to avoid empty input
    const userMsgElement = document.createElement("p");
    userMsgElement.classList.add("user-msg");
    userMsgElement.textContent = userMsg;
    chatsContainer.appendChild(userMsgElement);
    
    // Clear input after send
    userInput.value = "";
    
    //remove introduction
    introduction.style.display = "none";
    
    const botResElement = document.createElement("p");
    botResElement.classList.add("bot-msg");
    chatsContainer.appendChild(botResElement);
    
    // Moving dots because its cool
    let dotCount = 0;
    const maxDots = 3;
    const typingDotsInterval = setInterval(() => {
        dotCount = (dotCount + 1) % (maxDots + 1); // cycles 0 → 1 → 2 → 3 → 0
        botResElement.innerHTML = "Thinking" + ".".repeat(dotCount);
    }, 350);
    
    // Randomized bot thinking time
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 4000));
    
    // Stop dot animation
    clearInterval(typingDotsInterval);
    
    // Get response
    const botRes = await getBotRes(userMsg);
    
    // Put the full HTML in the element then fade in
    botResElement.innerHTML = botRes;
    botResElement.style.opacity = "0"; 
    
    let opacity = 0;
    const fadeIn = setInterval(() => {
      if (opacity < 1) {
        opacity += 0.1;
        botResElement.style.opacity = opacity;
      } else {
        clearInterval(fadeIn);
      }
    }, 50);
    
    // Activate MathJax
    if (window.MathJax) {
      MathJax.typesetPromise([botResElement]);
    }
  }
});

const fileInput = document.querySelector("#file-input");
const addFileBtn = document.querySelector("#add-file-btn");
let selectedImage = null;

addFileBtn.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    // Save the Base64 data to send later
    selectedImage = e.target.result.split(",")[1]; 
    addFileBtn.style.color = "#4CAF50"; // Glow green when attached
  };
  reader.readAsDataURL(file);
});


async function getBotRes(userMsg) {
  const errorText = document.createElement("p");
  errorText.classList.add("err-msg");
  
  try {
  // Build the content array (Text + Image if exists)
  let content = [{ type: "text", text: userMsg }];
  
  if (selectedImage) {
    content.push({
      type: "image_url",
      image_url: { url: `data:image/jpeg;base64,${selectedImage}` }
    });
  }

  chatHistory.push({ role: "user", content: content });
  
  // keep system intructions and past convos and only save 15 to save quota
    if (chatHistory.length > 16) { 
      // We say 16 because index 0 is system instruct, then we want 15 more.
      chatHistory = [
        chatHistory[0], // Keep the instructions safe!
        ...chatHistory.slice(-15) // Grab only the 15 most recent messages
      ];
    }
  
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messages: chatHistory
    })
  });
  
  const data = await response.json();
  
  // check
  if (data && data.choices && data.choices.length > 0) {
    const rawText = data.choices[0].message.content;

    const cleanHTML = marked.parse(rawText);
  
    chatHistory.push({ role: "assistant", content: rawText });
    selectedImage = null; // Clear image after sending
    addFileBtn.style.color = ""; // Reset button color

    return cleanHTML;
  } else {
    console.error("API Error details:", data);
    errorText.textContent = "Error: " + (data.error?.message || "Too many request! Try again later.");;
    chatsContainer.appendChild(errorText);
    return "";
  }
  } catch(error) { // Error catch
    console.log(error);
    errorText.textContent = "Error: " + error + " Try checking internet connection. If error persists, contact developer!";
    chatsContainer.appendChild(errorText);
    return "";
  }
}

//clears chats from chat window
deleteBtn.addEventListener("click", () => {
  chatsContainer.innerHTML = "";
  
  // Bring back intro
  introduction.style.display = "";
});