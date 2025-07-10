const express = require('express');
const router = express.Router();
const pool = require('../models/db');
const sendEmail = require("../utils/sendEmail");

// Show FAQ page
// router.get('/faq', async (req, res) => {
//     const infoResult = await pool.query(
//         'SELECT * FROM ministry_info ORDER BY id DESC LIMIT 1',
//       );
//       const info = infoResult.rows[0] || {};
// const result = await pool.query('SELECT * FROM faqs WHERE is_published = true ORDER BY created_at DESC');
// res.render('faq', { info, faqs: result.rows, title:'FAQS' });
// });

router.get("/faq", async (req, res) => {
  try {
    const search = req.query.search || "";
    let faqResult;

    if (search) {
      faqResult = await pool.query(
        "SELECT * FROM faqs WHERE LOWER(question) LIKE $1 ORDER BY created_at DESC",
        [`%${search.toLowerCase()}%`]
      );
    } else {
      faqResult = await pool.query(
        "SELECT * FROM faqs ORDER BY created_at DESC"
      );
    }

    const infoResult = await pool.query(
      "SELECT * FROM ministry_info ORDER BY id DESC LIMIT 1"
    );

    res.render("faq", {
      info: infoResult.rows[0] || {},
      faqs: faqResult.rows,
      search, // pass current search back to the EJS view
      user: req.session.user || null,
    });
  } catch (err) {
    console.error("Error fetching FAQs:", err);
    res.status(500).send("Error loading FAQs");
  }
});


// Handle question submission
router.post('/faq/ask', async (req, res) => {
const { question, email } = req.body;

if (!question || question.trim() === '') {
return res.redirect('/faq');
}
const created_at = new Date(); // Create timestamp in JS
  await pool.query('INSERT INTO faqs (question, email, created_at) VALUES ($1, $2, $3)', [question, email, created_at]);
  // Email notification to admin
const adminEmail = 'imoledayoimmanuel@gmail.com'; // change to your actual admin email
const subject = 'New FAQ Question Submitted';
const message ='<h3>New FAQ Submitted</h3> <p><strong>Question:</strong> ${question}</p> <p><strong>User Email:</strong> ${email}</p> <p>Please log in to the dashboard to answer it</p>' ;

try {
await sendEmail(adminEmail, subject, message);
console.log('Admin notified about new FAQ.');
} catch (err) {
console.error('Failed to send FAQ notification email:', err.message);
}
res.redirect('/faq?success=true');
});

module.exports = router;