const express = require("express");
const router = express.Router();
const pool = require("../models/db");
const { sendFaqAnswerEmail } = require("../utils/sendEmail");
const requireAdmin = require("../middlewares/requireAdmin");

// Show all FAQs
// router.get("/admin/faqs", async (req, res) => {
//   const infoResult = await pool.query(
//     "SELECT * FROM ministry_info ORDER BY id DESC LIMIT 1"
//   );
//   const info = infoResult.rows[0] || {};
//   const result = await pool.query(
//     "SELECT * FROM faqs ORDER BY created_at DESC"
//   );
//   res.render("admin/manageFaqs", {info, faqs: result.rows, title: "Manage FAQ" });
// });

router.get("/admin/faqs", requireAdmin, async (req, res) => {
  try {
    const { filter } = req.query;

    const infoResult = await pool.query(
      "SELECT * FROM ministry_info ORDER BY id DESC LIMIT 1"
    );
    const info = infoResult.rows[0] || {};

    let query = "SELECT * FROM faqs WHERE 1=1";
    const params = [];

    if (filter === "published") {
      query += " AND is_published = true";
    } else if (filter === "answered") {
      query += " AND answer IS NOT NULL AND TRIM(answer) != ''";
    } else if (filter === "unanswered") {
      query += " AND (answer IS NULL OR TRIM(answer) = '')";
    }

    query += " ORDER BY created_at DESC";

    const result = await pool.query(query, params);

    res.render("admin/manageFaqs", {
      info,
      faqs: result.rows,
      title: "Manage FAQ",
      filter,
    });
  } catch (err) {
    console.error("Error fetching FAQs:", err);
    res.status(500).send("Server Error");
  }
});

// Show edit form
router.get("/admin/faqs/edit/:id", requireAdmin, async (req, res) => {
  const result = await pool.query("SELECT * FROM faqs WHERE id = $1", [
    req.params.id,
  ]);
  res.render("admin/editFaq", { faq: result.rows[0], title: "Edit FAQ" });
});

// Handle update
router.post("/admin/faqs/update/:id", requireAdmin, async (req, res) => {
  const { answer, is_published } = req.body;
  const id = req.params.id;
  const created_at = new Date(); // Create timestamp in JS

  // Read the old answer first, so the asker is only emailed when the answer changes
  // (not every time an admin toggles "published")
  const before = await pool.query(
    "SELECT question, email, answer FROM faqs WHERE id = $1",
    [id]
  );

  await pool.query(
    "UPDATE faqs SET answer = $1, is_published = $2, created_at = $3 WHERE id = $4",
    [answer, is_published === "on", created_at, id]
  );

  if (before.rows.length > 0) {
    const faq = before.rows[0];
    const answerChanged = (answer || "").trim() !== (faq.answer || "").trim();

    if (faq.email && answer?.trim() && answerChanged) {
      try {
        await sendFaqAnswerEmail(faq.email, faq.question, answer, id);
      } catch (err) {
        console.error("Email send error:", err.message);
      }
    }
  }
  res.redirect("/admin/faqs");
});

// Handle delete
router.post("/admin/faqs/delete/:id", requireAdmin, async (req, res) => {
  await pool.query("DELETE FROM faqs WHERE id = $1", [req.params.id]);
  res.redirect("/admin/faqs");
});

module.exports = router;
