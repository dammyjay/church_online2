    // const { text } = require('body-parser');
    // const nodemailer = require('nodemailer');

    // const transporter = nodemailer.createTransport({
    // service: 'gmail', // or use host/port if you use a different provider
    // auth: {
    // user: process.env.EMAIL_USER,
    // pass: process.env.EMAIL_PASS
    // }
    // });

    // const sendFaqAnswerEmail = async (to, question, answer) => {
    //     const mailOptions = {
    //     // from: "Your Ministry" <${process.env.EMAIL_USERNAME}>,
    //     to,
    //     subject: 'Your question has been answered',
    //     // html: <p><strong>Q:</strong> ${question}</p> <p><strong>A:</strong> ${answer}</p> <p>Thank you for reaching out to us.</p>
    //     text: `Q: ${question}\nA: ${answer}\n\nThank you for reaching out to us.`,
    //     };
        
    //     await transporter.sendMail(mailOptions);
    //     };

    // async function sendEmail(to, subject, message) {
    // await transporter.sendMail({
    // // from: "Ministry Web App" <${user}>,
    // to,
    // subject,
    // html: message
    // });
    // };


    // module.exports = sendFaqAnswerEmail;
    // module.exports = sendEmail;
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  // 465 (TLS from the start) is blocked by fewer networks/hosts than 587
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

// Turn SMTP errors into a log line that says what to fix
function explainEmailError(err) {
  if (err.code === "EAUTH" || err.responseCode === 535) {
    return "Gmail rejected EMAIL_USER / EMAIL_PASS. Create a new Gmail app password and update it where the app runs (Railway Variables for the live site).";
  }
  if (["ETIMEDOUT", "ECONNECTION", "ESOCKET", "ECONNREFUSED", "EDNS"].includes(err.code)) {
    return "Could not reach smtp.gmail.com. The host is probably blocking outgoing SMTP (Railway only allows it on paid plans); use an HTTP email API instead.";
  }
  return "Unexpected email error.";
}

async function deliver(mail) {
  try {
    await transporter.sendMail(mail);
  } catch (err) {
    console.error(`❌ Email to ${mail.to} failed [${err.code || "unknown"}]: ${err.message}\n   → ${explainEmailError(err)}`);
    throw err;
  }
}

// Check the email setup once at startup so problems show up in the deploy logs
transporter
  .verify()
  .then(() => console.log("✅ Email (Gmail SMTP) is ready"))
  .catch((err) => console.error(`❌ Email (Gmail SMTP) is NOT working [${err.code || "unknown"}]: ${err.message}\n   → ${explainEmailError(err)}`));

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
