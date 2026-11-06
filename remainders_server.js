// remainders_server.js
// Single combined server: serves all pages, medicine reminders API + Twilio,
// the chatbot's /chat route, and login/register auth — all on one port.

require("dotenv").config({ path: "./.env.medicine" });
const express = require("express");
const fs = require("fs");
const path = require("path");
const cron = require("node-cron");
const twilio = require("twilio");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const { randomUUID } = require("crypto");

const app = express();
const PORT = process.env.PORT || 4000;
const DATA_FILE = path.join(__dirname, "reminders.json");
const USERS_FILE = path.join(__dirname, "users.json");

app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || "fallback-dev-secret-change-me",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));

// ---------- User storage ----------
function loadUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(USERS_FILE, "utf-8")); } catch { return []; }
}
function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// ---------- Auth routes ----------
app.post("/api/register", async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ error: "All fields are required." });
  }
  const users = loadUsers();
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ error: "An account with this email already exists." });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  users.push({ id: randomUUID(), firstName, lastName, email, passwordHash });
  saveUsers(users);
  res.status(201).json({ message: "Registered successfully." });
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const users = loadUsers();
  const user = users.find((u) => u.email.toLowerCase() === (email || "").toLowerCase());
  if (!user) return res.status(401).json({ error: "Invalid email or password." });

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return res.status(401).json({ error: "Invalid email or password." });

  req.session.userId = user.id;
  req.session.firstName = user.firstName;
  res.json({ message: "Logged in.", firstName: user.firstName });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => res.json({ message: "Logged out." }));
});

app.get("/api/me", (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "Not logged in." });
  res.json({ firstName: req.session.firstName });
});

// ---------- Auth guard for protected pages ----------
const PROTECTED_PAGES = ["/Homepage.html", "/bot.html", "/maps.html", "/remainders.html", "/calender.html"];
const PROTECTED_APIS = ["/api/reminders", "/chat"];

app.use((req, res, next) => {
  const needsAuth =
    PROTECTED_PAGES.includes(req.path) ||
    PROTECTED_APIS.some((p) => req.path.startsWith(p));

  if (needsAuth && !req.session.userId) {
    if (req.path.startsWith("/api") || req.path === "/chat") {
      return res.status(401).json({ error: "Please log in first." });
    }
    return res.redirect("/Login.html");
  }
  next();
});

// ---------- Mount chatbot + serve all static pages (ONCE, no duplicates) ----------
const chatbotApp = require("./bot1.js");
app.use(chatbotApp);
app.use(express.static(__dirname));

// ---------- Twilio setup ----------
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const SMS_FROM = process.env.TWILIO_SMS_NUMBER;
const WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_NUMBER;

// ---------- Simple JSON-file storage ----------
function loadReminders() {
  if (!fs.existsSync(DATA_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  } catch {
    return [];
  }
}

function saveReminders(reminders) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(reminders, null, 2));
}

// ---------- Reminders API routes ----------
app.get("/api/reminders", (req, res) => {
  res.json(loadReminders());
});

app.post("/api/reminders", (req, res) => {
  const { patientName, phone, medicineName, dosage, times, remindBeforeMinutes, frequency, onceDate, channel } = req.body;

  if (!patientName || !phone || !medicineName || !times || !times.length) {
    return res.status(400).json({ error: "Missing required fields." });
  }
  if (!phone.startsWith("+")) {
    return res.status(400).json({ error: "Phone number must include country code, starting with +." });
  }

  const reminders = loadReminders();
  const newReminder = {
    id: randomUUID(),
    patientName,
    phone,
    medicineName,
    dosage: dosage || "",
    times,
    remindBeforeMinutes: remindBeforeMinutes || 0,
    frequency: frequency === "once" ? "once" : "daily",
    onceDate: onceDate || null,
    channel: ["sms", "whatsapp", "call", "all"].includes(channel) ? channel : "sms",
    lastSentKeys: [],
    createdAt: new Date().toISOString(),
  };

  reminders.push(newReminder);
  saveReminders(reminders);
  res.status(201).json(newReminder);
});

app.delete("/api/reminders/:id", (req, res) => {
  let reminders = loadReminders();
  reminders = reminders.filter((r) => r.id !== req.params.id);
  saveReminders(reminders);
  res.status(204).end();
});

// ---------- Messaging ----------
async function sendMessage(reminder) {
  const body = `Medicine reminder: Please take ${reminder.medicineName}${
    reminder.dosage ? " (" + reminder.dosage + ")" : ""
  } now.`;

  const tasks = [];
  const wantsSms = reminder.channel === "sms" || reminder.channel === "all";
  const wantsWhatsapp = reminder.channel === "whatsapp" || reminder.channel === "all";
  const wantsCall = reminder.channel === "call" || reminder.channel === "all";

  if (wantsSms) {
    tasks.push(
      twilioClient.messages
        .create({ body, from: SMS_FROM, to: reminder.phone })
        .then(() => console.log(`SMS sent to ${reminder.phone} for ${reminder.medicineName}`))
        .catch((err) => console.error(`SMS failed for ${reminder.phone}:`, err.message))
    );
  }

  if (wantsWhatsapp) {
    tasks.push(
      twilioClient.messages
        .create({ body, from: WHATSAPP_FROM, to: `whatsapp:${reminder.phone}` })
        .then(() => console.log(`WhatsApp sent to ${reminder.phone} for ${reminder.medicineName}`))
        .catch((err) => console.error(`WhatsApp failed for ${reminder.phone}:`, err.message))
    );
  }

  if (wantsCall) {
    const spokenText = `Medicine reminder. Please take ${reminder.medicineName}${
      reminder.dosage ? ", " + reminder.dosage : ""
    }, now. I repeat. Please take ${reminder.medicineName} now.`;
    const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Aditi" language="en-IN">${escapeXml(spokenText)}</Say></Response>`;

    tasks.push(
      twilioClient.calls
        .create({ twiml, from: SMS_FROM, to: reminder.phone })
        .then(() => console.log(`Voice call placed to ${reminder.phone} for ${reminder.medicineName}`))
        .catch((err) => console.error(`Voice call failed for ${reminder.phone}:`, err.message))
    );
  }

  await Promise.all(tasks);
}

function escapeXml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function subtractMinutes(hhmm, minutesToSubtract) {
  const [h, m] = hhmm.split(":").map(Number);
  const totalMinutes = ((h * 60 + m - minutesToSubtract) % 1440 + 1440) % 1440;
  const newH = Math.floor(totalMinutes / 60);
  const newM = totalMinutes % 60;
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
}

// ---------- The scheduler: runs every minute ----------
cron.schedule("* * * * *", async () => {
  const now = new Date();
  const currentHHMM = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const currentDate = now.toISOString().split("T")[0];

  const reminders = loadReminders();
  let changed = false;

  for (const reminder of reminders) {
    if (reminder.frequency === "once" && reminder.onceDate !== currentDate) continue;

    for (const doseTime of reminder.times) {
      const reminderTime = subtractMinutes(doseTime, reminder.remindBeforeMinutes || 0);
      const sentKey = `${currentDate}_${doseTime}`;

      if (reminderTime === currentHHMM && !reminder.lastSentKeys.includes(sentKey)) {
        await sendMessage(reminder);
        reminder.lastSentKeys.push(sentKey);
        if (reminder.lastSentKeys.length > 60) reminder.lastSentKeys.shift();
        changed = true;
      }
    }
  }

  if (changed) saveReminders(reminders);
});

app.listen(PORT, () => {
  console.log(`✅ Everything running at http://localhost:${PORT}`);
});