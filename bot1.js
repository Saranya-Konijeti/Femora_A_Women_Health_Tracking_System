const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { GoogleGenAI } = require("@google/genai");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// NOTE: no express.static(__dirname) here anymore, and no app.listen() —
// remainders_server.js handles both of those now, for the whole project.

let ai = null;
if (!process.env.GEMINI_API_KEY) {
    console.warn("⚠️  GEMINI_API_KEY not found in .env — chatbot will reply with an error until this is set.");
} else {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

// Chat Endpoint
app.post("/chat", async (req, res) => {
    if (!ai) {
        return res.status(500).json({ reply: "Chatbot isn't configured yet (missing GEMINI_API_KEY)." });
    }

    try {
        const { message } = req.body;

        const prompt = `
You answer only educational questions related to:
- Menstrual cycles
- Period pain
- Pregnancy
- PCOS
- Ovulation
- Women's hygiene
- Nutrition
- Exercise

Rules:
1. Never diagnose diseases.
2. Never prescribe medicines.
3. Never recommend drug dosages.
4. If symptoms are severe, advise consulting a gynecologist or visiting the nearest hospital.
5. Keep responses short, clear, and friendly.

User Question:
${message}
`;

        const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: prompt,
        });

        res.json({ reply: response.text });

    } catch (error) {
        console.log("=========== GEMINI ERROR ===========");
        console.error(error);
        console.log("===================================");
        res.status(500).json({ reply: "Sorry! Something went wrong." });
    }
});

module.exports = app;