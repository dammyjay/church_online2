const express = require('express');
const router = express.Router();
const pool = require('../models/db'); // your PostgreSQL connection

router.post('/subscribe', async (req, res) => {
const { email } = req.body;

try {
await pool.query(
'INSERT INTO subscribers (email) VALUES ($1) ON CONFLICT DO NOTHING',
[email]
);
res.redirect('/?subscribed=success');
} catch (err) {
console.error('Subscription error:', err);
res.redirect('/?subscribed=fail');
}
});

module.exports = router;