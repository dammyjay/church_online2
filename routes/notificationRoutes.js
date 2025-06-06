const express = require("express");
const router = express.Router();
const pool = require("../models/db");

router.post("/subscribe", async (req, res) => {
  const sub = req.body;

  // Store subscription in DB or memory (simplified)
  await pool.query(
    "INSERT INTO subscriptions (endpoint, keys, created_at) VALUES ($1, $2, NOW()) ON CONFLICT (endpoint) DO NOTHING",
    [sub.endpoint, JSON.stringify(sub.keys)]
  );

  res.status(201).json({ message: "Subscribed" });
});

module.exports = router;
