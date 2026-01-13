const axios = require("axios");

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;

async function sendDevotionalToTelegram(devotional) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHANNEL_ID) return;

  let message = `
📖 *Today's Devotional*

*${devotional.title}*

_${devotional.scripture || ""}_

${devotional.content.substring(0, 3500)}
`;

  try {
    await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: TELEGRAM_CHANNEL_ID,
        text: message,
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      }
    );
  } catch (err) {
    console.error("Telegram send failed:", err.message);
  }
}

module.exports = sendDevotionalToTelegram;
