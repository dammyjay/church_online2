
const cron = require("node-cron");
const pool = require("../models/db");
const webpush = require("../utils/webpushConfig");

const runDevotionalScheduler = () => {
  // cron.schedule("*/5 * * * *", async () => {
  //   const now = new Date();

  //   const result = await pool.query(
  //     "SELECT * FROM devotionals WHERE visible = false AND scheduled_at <= $1",
  //     [now]
  //   );

  //   for (const devotional of result.rows) {
  //     // Send push notification
  //     const payload = JSON.stringify({
  //       title: devotional.title,
  //       message: "Today's devotional is now available!",
  //       url: "/#devotionals",
  //     });

  //     const subsResult = await pool.query("SELECT * FROM subscriptions");

  //     for (const sub of subsResult.rows) {
  //       const pushSubscription = {
  //         endpoint: sub.endpoint,
  //         keys: sub.keys,
  //       };

  //       try {
  //         await webpush.sendNotification(pushSubscription, payload);
  //       } catch (err) {
  //         console.error("Notification failed:", err);
  //       }
  //     }

  //     await pool.query(
  //       "UPDATE devotionals SET visible = true WHERE visible = false AND scheduled_at IS NOT NULL AND scheduled_at <= $1",
  //       [now]
  //     );
  //   }
  // });
  const sendDevotionalToTelegram = require("../utils/telegram");

cron.schedule("*/5 * * * *", async () => {
  const now = new Date();

  const result = await pool.query(
    `
    SELECT *
    FROM devotionals
    WHERE visible = false
      AND scheduled_at <= $1
      AND sent_to_telegram = false
    `,
    [now]
  );

  for (const devotional of result.rows) {
    // Send Telegram
    await sendDevotionalToTelegram(devotional);

    // Mark visible + sent
    await pool.query(
      `
      UPDATE devotionals
      SET visible = true,
          sent_to_telegram = true
      WHERE id = $1
      `,
      [devotional.id]
    );
  }
});


};

module.exports = runDevotionalScheduler;
