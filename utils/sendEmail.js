// Email sending.
// - If BREVO_API_KEY is set, mail goes through Brevo's HTTP API (port 443).
//   Use this on Railway, which blocks outgoing SMTP on free/hobby plans.
// - Otherwise it falls back to Gmail SMTP with EMAIL_USER / EMAIL_PASS (fine locally).
const nodemailer = require("nodemailer");

const BREVO_API_KEY = process.env.BREVO_API_KEY;
// Sender address; with Brevo it must be a verified sender in your Brevo account
const FROM_EMAIL = process.env.EMAIL_FROM || process.env.EMAIL_USER;
const FROM_NAME = process.env.EMAIL_FROM_NAME || "C&S Church Online";

// ---------- Brevo (HTTP API) ----------
async function sendWithBrevo({ to, subject, html, text }) {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": BREVO_API_KEY,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: { email: FROM_EMAIL, name: FROM_NAME },
      to: [{ email: to }],
      subject,
      ...(html ? { htmlContent: html } : { textContent: text }),
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    const body = await res.text();
    const err = new Error(`Brevo API ${res.status}: ${body}`);
    err.code = `BREVO_${res.status}`;
    throw err;
  }
}

// ---------- Gmail SMTP (fallback) ----------
const transporter = BREVO_API_KEY
  ? null
  : nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      pool: true,
      maxConnections: 3,
      maxMessages: 50,
      rateLimit: true,
      // Fail fast instead of nodemailer's 2-minute default, so signups don't hang
      connectionTimeout: 15000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
    });

// Turn errors into a log line that says what to fix
function explainEmailError(err) {
  if (String(err.code).startsWith("BREVO_401")) {
    return "Brevo rejected BREVO_API_KEY. Create a new API key in Brevo (SMTP & API → API Keys) and update it in Railway Variables.";
  }
  if (String(err.code).startsWith("BREVO_400")) {
    return "Brevo refused the message. Check that EMAIL_FROM (or EMAIL_USER) is a verified sender in Brevo (Senders, Domains & Dedicated IPs → Senders).";
  }
  if (String(err.code).startsWith("BREVO_")) {
    return "Brevo API error; see the message above.";
  }
  if (err.code === "EAUTH" || err.responseCode === 535) {
    return "Gmail rejected EMAIL_USER / EMAIL_PASS. Create a new Gmail app password and update it in .env.";
  }
  if (["ETIMEDOUT", "ECONNECTION", "ESOCKET", "ECONNREFUSED", "EDNS"].includes(err.code)) {
    return "Could not reach smtp.gmail.com. The host is blocking outgoing SMTP (Railway does on free/hobby plans). Set BREVO_API_KEY to send over HTTPS instead.";
  }
  return "Unexpected email error.";
}

async function deliver(mail) {
  try {
    if (BREVO_API_KEY) {
      await sendWithBrevo(mail);
    } else {
      await transporter.sendMail({ from: `"${FROM_NAME}" <${FROM_EMAIL}>`, ...mail });
    }
  } catch (err) {
    console.error(`❌ Email to ${mail.to} failed [${err.code || "unknown"}]: ${err.message}\n   → ${explainEmailError(err)}`);
    throw err;
  }
}

// Report the email setup once at startup so problems show up in the deploy logs
if (BREVO_API_KEY) {
  console.log(`✅ Email: using Brevo API (sender ${FROM_EMAIL || "NOT SET — set EMAIL_FROM"})`);
} else {
  transporter
    .verify()
    .then(() => console.log("✅ Email (Gmail SMTP) is ready"))
    .catch((err) => console.error(`❌ Email (Gmail SMTP) is NOT working [${err.code || "unknown"}]: ${err.message}\n   → ${explainEmailError(err)}`));
}

const sendFaqAnswerEmail = async (to, question, answer) => {
  await deliver({
    to,
    subject: "Your question has been answered",
    text: `Q: ${question}\nA: ${answer}\n\nThank you for reaching out to us.`,
  });
};

const sendEmail = async (to, subject, message) => {
  await deliver({
    to,
    subject,
    html: message,
  });
};

// Where new FAQ / testimony alerts go; set ADMIN_EMAIL in .env to change it
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "imoledayoimmanuel@gmail.com";

module.exports = {
  sendFaqAnswerEmail,
  sendEmail,
  ADMIN_EMAIL,
};
