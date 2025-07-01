// const cron = require("node-cron");
// const pool = require("../models/db");
// const sendEmail = require("../utils/sendEmail");

// const runNewsletterScheduler = () => {
//   cron.schedule("*/5 * * * *", async () => {
//     try {
//       const now = new Date();
//       const result = await pool.query(
//         "SELECT * FROM newsletters WHERE sent = false AND scheduled_at <= $1",
//         [now]
//       );

//       for (const newsletter of result.rows) {
//         const userResult = await pool.query(
//           "SELECT email FROM users2 WHERE email IS NOT NULL"
//         );
//         // const emails = userResult.rows.map((row) => row.email);
//         // ✅ Replace with test emails
//         const emails = [
//           "jaykirchtechhub@gmail.com",
//           "dammykirchhoff@gmail.com",
//           "dammykirchhoff2@gmail.com", // Replace with your own
//         ];

//         let htmlMsg = `<div>${newsletter.message}</div>`;
//         if (newsletter.image_url) {
//           htmlMsg += `<div><img src="${newsletter.image_url}" style="max-width:100%;border-radius:8px;"></div>`;
//         }

//         for (const email of emails) {
//           await sendEmail(email, newsletter.subject, htmlMsg);
//         }

//         // Mark as sent
//         await pool.query("UPDATE newsletters SET sent = true WHERE id = $1", [
//           newsletter.id,
//         ]);

//         console.log(`✅ Newsletter "${newsletter.subject}" sent`);
//       }
//     } catch (err) {
//       console.error("❌ Cron job error:", err);
//     }
//   });
// };

// module.exports = runNewsletterScheduler;



const cron = require("node-cron");
const pool = require("../models/db");
const sendEmail = require("../utils/sendEmail");

const runNewsletterScheduler = () => {
  cron.schedule("*/5 * * * *", async () => {
    try {
      const now = new Date();
      const result = await pool.query(
        "SELECT * FROM newsletters WHERE sent = false AND scheduled_at <= $1",
        [now]
      );

      for (const newsletter of result.rows) {
        const testEmails = [
          "jaykirchtechhub@gmail.com",
          "dammykirchhoff@gmail.com",
          "isaacbayo6@gmail.com",
          "imoledayoimmanuel@gmail.com",
        ];

        let htmlMsg = `<div>${newsletter.message}</div>`;
        if (newsletter.image_url) {
          htmlMsg += `<div><img src="${newsletter.image_url}" style="max-width:100%;border-radius:8px;"></div>`;
        }

        for (const email of testEmails) {
          await sendEmail(email, newsletter.subject, htmlMsg);
        }

        await pool.query("UPDATE newsletters SET sent = true WHERE id = $1", [
          newsletter.id,
        ]);
        console.log(`✅ Newsletter "${newsletter.subject}" sent`);
      }
    } catch (err) {
      console.error("❌ Cron job error:", err);
    }
  });
};

module.exports = runNewsletterScheduler;
