

const express = require('express');
const router = express.Router();
const pool = require('../models/db');
const { sendFaqAnswerEmail } = require('../utils/sendEmail');

// Show all FAQs
router.get('/admin/faqs', async (req, res) => {
const result = await pool.query('SELECT * FROM faqs ORDER BY created_at DESC');
res.render('admin/manageFaqs', { faqs: result.rows });
});

// Show edit form
router.get('/admin/faqs/edit/:id', async (req, res) => {
const result = await pool.query('SELECT * FROM faqs WHERE id = $1', [req.params.id]);
res.render('admin/editFaq', { faq: result.rows[0] });
});

// Handle update
router.post('/admin/faqs/update/:id', async (req, res) => {
    const { answer, is_published } = req.body;
    const created_at = new Date(); // Create timestamp in JS
await pool.query(
'UPDATE faqs SET answer = $1, is_published = $2, created_at = $3 WHERE id = $4',
[answer, is_published === 'on', created_at, req.params.id]
    );
    
    // Get email of question submitter
    const id = req.params.id;
const result = await pool.query('SELECT question, email FROM faqs WHERE id = $1', [id]);
    if (result.rows.length > 0) {
        const faq = result.rows[0];

        // If there's an email and a new answer, send notification
        if (faq.email && answer?.trim()) {
            try {
                await sendFaqAnswerEmail(faq.email, faq.question, answer);
            } catch (err) {
                console.error('Email send error:', err.message);
            }
        }
    }
res.redirect('/admin/faqs');
});

// Handle delete
router.post('/admin/faqs/delete/:id', async (req, res) => {
await pool.query('DELETE FROM faqs WHERE id = $1', [req.params.id]);
res.redirect('/admin/faqs');
});

module.exports = router;