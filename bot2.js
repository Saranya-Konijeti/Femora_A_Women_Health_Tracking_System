const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("userInput");

// Send on Enter
userInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
        sendMessage();
    }
});

// Suggestion buttons
function fillQuestion(question) {
    userInput.value = question;
    userInput.focus();
}

// Send message
async function sendMessage() {

    const message = userInput.value.trim();

    if (message === "") return;

    // Display user message
    addUserMessage(message);

    userInput.value = "";

    // Typing indicator
    const typing = document.createElement("div");
    typing.className = "bot-message";
    typing.id = "typing";

    typing.innerHTML = `
        <div class="avatar">🤖</div>
        <div class="message typing">
            Femora AI is typing...
        </div>
    `;

    chatBox.appendChild(typing);
    chatBox.scrollTop = chatBox.scrollHeight;

    try {

        const response = await fetch("http://localhost:4000/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: message
            })
        });

        const data = await response.json();

        const typingDiv = document.getElementById("typing");
        if (typingDiv) typingDiv.remove();

        addBotMessage(data.reply);

    } catch (error) {

        const typingDiv = document.getElementById("typing");
        if (typingDiv) typingDiv.remove();

        addBotMessage("Sorry! I couldn't connect to the AI server.");

        console.error(error);
    }

}

// User message
function addUserMessage(text) {

    const div = document.createElement("div");

    div.className = "user-message";

    div.innerHTML = `
        <div class="message">
            ${text}
        </div>
    `;

    chatBox.appendChild(div);

    chatBox.scrollTop = chatBox.scrollHeight;
}

// Bot message
function addBotMessage(text) {

    const div = document.createElement("div");

    div.className = "bot-message";

    div.innerHTML = `
        <div class="avatar">
            🤖
        </div>

        <div class="message">
            <h4>Femora AI</h4>
            ${text.replace(/\n/g,"<br>")}
        </div>
    `;

    chatBox.appendChild(div);

    chatBox.scrollTop = chatBox.scrollHeight;
}