// Styled HTML bodies for every email the site sends.
// Email clients ignore <style> blocks and external CSS, so everything is inline
// and laid out with tables. Each builder returns { subject, html }.

const SITE_URL = (process.env.SITE_URL || "https://cschurchonline.org").replace(/\/+$/, "");
const SITE_NAME = "C&S Church Online";

const C = {
  bg: "#f6f3ec",
  card: "#ffffff",
  text: "#2b2620",
  muted: "#6f665b",
  gold: "#b8963e",
  goldSoft: "#f7f0de",
  border: "#ece5d6",
};

const FONT = "font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;";

// Text typed by visitors (FAQ questions come from a rich-text editor): keep the words, drop the markup
const { escapeHtml, plainText: plain } = require("./safeText");

const url = (path) => SITE_URL + path;

function button(label, href) {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 8px;">
    <tr><td style="border-radius:8px;background:${C.gold};">
      <a href="${href}" target="_blank" style="display:inline-block;padding:13px 28px;${FONT}font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">${label}</a>
    </td></tr>
  </table>`;
}

function heading(text) {
  return `<h1 style="margin:0 0 12px;${FONT}font-size:22px;line-height:1.3;color:${C.text};">${text}</h1>`;
}

function para(html) {
  return `<p style="margin:0 0 14px;${FONT}font-size:15px;line-height:1.65;color:${C.text};">${html}</p>`;
}

// A shaded box, e.g. for the question being answered
function panel(label, html) {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:18px 0;">
    <tr><td style="background:${C.goldSoft};border-left:4px solid ${C.gold};border-radius:6px;padding:16px 18px;">
      ${label ? `<div style="${FONT}font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:${C.gold};margin-bottom:6px;">${label}</div>` : ""}
      <div style="${FONT}font-size:15px;line-height:1.65;color:${C.text};">${html}</div>
    </td></tr>
  </table>`;
}

// Label / value rows, e.g. a new member's details
function details(rows) {
  const body = rows
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(
      ([label, value]) => `
      <tr>
        <td style="padding:9px 0;border-bottom:1px solid ${C.border};${FONT}font-size:14px;color:${C.muted};width:38%;vertical-align:top;">${label}</td>
        <td style="padding:9px 0;border-bottom:1px solid ${C.border};${FONT}font-size:14px;color:${C.text};font-weight:600;">${value}</td>
      </tr>`
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;">${body}</table>`;
}

// Wrap a body in the branded frame (logo header, card, footer)
function layout(content, { preheader = "" } = {}) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${SITE_NAME}</title>
</head>
<body style="margin:0;padding:0;background:${C.bg};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.bg};">
    <tr><td align="center" style="padding:32px 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;">
        <tr><td align="center" style="padding-bottom:20px;">
          <a href="${url("/")}" target="_blank" style="text-decoration:none;">
            <img src="${url("/logo.png")}" width="56" height="56" alt="${SITE_NAME}" style="display:block;border:0;border-radius:50%;margin:0 auto 8px;">
            <span style="${FONT}font-size:16px;font-weight:700;color:${C.text};">${SITE_NAME}</span>
          </a>
        </td></tr>
        <tr><td style="background:${C.card};border:1px solid ${C.border};border-top:4px solid ${C.gold};border-radius:12px;padding:32px 30px;">
          ${content}
        </td></tr>
        <tr><td align="center" style="padding:22px 12px 0;${FONT}font-size:12px;line-height:1.6;color:${C.muted};">
          Empowering lives through the gospel of Christ.<br>
          <a href="${url("/")}" style="color:${C.gold};text-decoration:none;">cschurchonline.org</a>
          &nbsp;·&nbsp;
          <a href="https://chat.whatsapp.com/KDcpdDfv3kX9NDnnQZVU72" style="color:${C.gold};text-decoration:none;">WhatsApp</a>
          &nbsp;·&nbsp;
          <a href="https://youtube.com/@candschurchonline" style="color:${C.gold};text-decoration:none;">YouTube</a>
          &nbsp;·&nbsp;
          <a href="https://t.me/cherubimandseraphimchurchonline" style="color:${C.gold};text-decoration:none;">Telegram</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ---------- Emails to members / visitors ----------

function otp(code) {
  return {
    subject: `${code} is your ${SITE_NAME} verification code`,
    html: layout(
      heading("Verify your email") +
        para("Thanks for joining us! Enter this code on the sign-up page to finish creating your account:") +
        `<div style="margin:24px 0;text-align:center;">
          <span style="display:inline-block;padding:16px 28px;background:${C.goldSoft};border:1px dashed ${C.gold};border-radius:10px;${FONT}font-size:32px;font-weight:700;letter-spacing:10px;color:${C.text};">${escapeHtml(code)}</span>
        </div>` +
        para(`<span style="color:${C.muted};font-size:13px;">The code expires in 10 minutes. If you didn't try to sign up, you can ignore this email.</span>`),
      { preheader: `Your verification code is ${code}` }
    ),
  };
}

function welcome(fullname) {
  const name = escapeHtml((fullname || "").trim().split(/\s+/)[0] || "friend");
  const feature = (icon, title, text, path) => `
    <tr><td style="padding:10px 0;border-bottom:1px solid ${C.border};">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="width:44px;vertical-align:top;${FONT}font-size:24px;">${icon}</td>
        <td style="vertical-align:top;">
          <a href="${url(path)}" style="${FONT}font-size:15px;font-weight:700;color:${C.text};text-decoration:none;">${title}</a>
          <div style="${FONT}font-size:14px;line-height:1.55;color:${C.muted};">${text}</div>
        </td>
      </tr></table>
    </td></tr>`;

  return {
    subject: `Welcome to ${SITE_NAME}, ${name}! 🙏`,
    html: layout(
      heading(`Welcome to the family, ${name}! 🎉`) +
        para("We're so glad you've joined us. Your account is ready, and there's a home for you here to learn, grow and connect with believers wherever you are.") +
        para("<strong>Here's what you can explore:</strong>") +
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          ${feature("📖", "Daily Devotionals", "Start each day with a word from Scripture and a short reflection.", "/devotionals")}
          ${feature("🎥", "Sermons & Videos", "Watch messages, worship and teachings anytime.", "/videos")}
          ${feature("📰", "Articles", "Read teachings and insights to strengthen your faith.", "/articles")}
          ${feature("🙌", "Testimonies", "Be encouraged by what God is doing, and share your own story.", "/testimony")}
          ${feature("❓", "Ask a Question", "Have a question about faith or the church? Ask, and we'll answer by email.", "/faq")}
        </table>` +
        button("Sign in and get started", url("/admin/login")) +
        para(`<span style="color:${C.muted};font-size:13px;">Tip: turn on notifications when your browser asks, so you never miss a new devotional or message.</span>`) +
        para(`God bless you,<br><strong>The ${SITE_NAME} team</strong>`),
      { preheader: "Your account is ready. Here's what you can explore." }
    ),
  };
}

function faqAnswered(questionHtml, answerHtml, faqId) {
  return {
    subject: "Your question has been answered",
    html: layout(
      heading("We've answered your question 💬") +
        para("Thank you for reaching out. Our team has replied to the question you asked:") +
        panel("Your question", plain(questionHtml)) +
        panel("Our answer", answerHtml) +
        button("View it on the website", url(faqId ? `/faq/${faqId}` : "/faq")) +
        para(`<span style="color:${C.muted};font-size:13px;">Have another question? You can always ask on our <a href="${url("/faq")}" style="color:${C.gold};">FAQ page</a>.</span>`),
      { preheader: "Our team has replied to your question." }
    ),
  };
}

function passwordReset(resetUrl) {
  return {
    subject: `Reset your ${SITE_NAME} password`,
    html: layout(
      heading("Reset your password") +
        para("We received a request to reset your password. Click the button below to choose a new one:") +
        button("Reset password", resetUrl) +
        para(`<span style="color:${C.muted};font-size:13px;">This link expires in 1 hour. If you didn't ask to reset your password, you can ignore this email; your password won't change.</span>`) +
        para(`<span style="color:${C.muted};font-size:12px;word-break:break-all;">Button not working? Paste this link into your browser:<br>${escapeHtml(resetUrl)}</span>`),
      { preheader: "Use this link to choose a new password." }
    ),
  };
}

// Newsletter: the admin writes the message (HTML) and may attach an image
function newsletter(subject, messageHtml, imageUrl) {
  return {
    subject,
    html: layout(
      heading(escapeHtml(subject)) +
        `<div style="${FONT}font-size:15px;line-height:1.65;color:${C.text};">${messageHtml || ""}</div>` +
        (imageUrl
          ? `<img src="${escapeHtml(imageUrl)}" alt="" style="display:block;width:100%;max-width:100%;height:auto;border-radius:8px;margin-top:20px;">`
          : "") +
        button("Visit the website", url("/home2")),
      { preheader: subject }
    ),
  };
}

// ---------- Alerts to the admin ----------

function adminNewUser(user) {
  return {
    subject: `New member: ${user.fullname || user.email}`,
    html: layout(
      heading("A new member just joined 🎉") +
        para("Someone has just verified their email and created an account:") +
        details([
          ["Full name", escapeHtml(user.fullname)],
          ["Email", `<a href="mailto:${escapeHtml(user.email)}" style="color:${C.gold};">${escapeHtml(user.email)}</a>`],
          ["Phone", escapeHtml(user.phone)],
          ["Gender", escapeHtml(user.gender)],
          ["Registered", escapeHtml(new Date().toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" }))],
        ]) +
        button("View their profile", url(`/admin/dashboard?viewUser=${user.id}`)),
      { preheader: `${user.fullname || user.email} just created an account.` }
    ),
  };
}

function adminNewFaq(questionHtml, email, faqId) {
  return {
    subject: "New question submitted on the FAQ page",
    html: layout(
      heading("New question waiting for an answer ❓") +
        panel("Question", plain(questionHtml)) +
        details([["Asked by", `<a href="mailto:${escapeHtml(email)}" style="color:${C.gold};">${escapeHtml(email)}</a>`]]) +
        para("They'll get an email with your answer as soon as you reply.") +
        button("Answer it now", url(faqId ? `/admin/faqs/edit/${faqId}` : "/admin/faqs?filter=unanswered")),
      { preheader: "Someone asked a question on the FAQ page." }
    ),
  };
}

function adminNewTestimony(name, email, messageText) {
  return {
    subject: `New testimony from ${name}`,
    html: layout(
      heading("A new testimony was shared 🙌") +
        details([
          ["Name", escapeHtml(name)],
          ["Email", email ? `<a href="mailto:${escapeHtml(email)}" style="color:${C.gold};">${escapeHtml(email)}</a>` : "Not given"],
        ]) +
        panel("Testimony", plain(messageText)) +
        para("Review it and publish it so others can be encouraged.") +
        button("Review testimonies", url("/admin/testimonies")),
      { preheader: `${name} shared a testimony.` }
    ),
  };
}

module.exports = {
  otp,
  welcome,
  faqAnswered,
  passwordReset,
  newsletter,
  adminNewUser,
  adminNewFaq,
  adminNewTestimony,
};
