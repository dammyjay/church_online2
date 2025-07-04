const cron = require("node-cron");
const pool = require("../models/db");

const runDevotionalScheduler = () => {
  cron.schedule("*/5 * * * *", async () => {
    const now = new Date();
    try {
      await pool.query(
        "UPDATE devotionals SET visible = true WHERE visible = false AND scheduled_at IS NOT NULL AND scheduled_at <= $1",
        [now]
      );
      console.log("⏰ Checked and published scheduled devotionals.");
    } catch (err) {
      console.error("❌ Devotional Scheduler Error:", err);
    }
  });
};

module.exports = runDevotionalScheduler;
