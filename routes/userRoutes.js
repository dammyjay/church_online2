const express = require('express');
const pool = require("../models/db");
const router = express.Router();
const userController = require('../controllers/userController');
const upload = require('../middlewares/upload');

router.post('/signup', upload.single('profile_picture'), userController.signup);
router.get('/signup', userController.showSignup);
router.post('/verify-otp', userController.verifyOtp);

router.get("/profile", userController.getUserProfile);
router.post(
  "/profile",
  upload.single("profile_picture"),
  userController.updateUserProfile
);

router.get("/vapid-public-key", (req, res) => {
  res.send(process.env.VAPID_PUBLIC_KEY);
});

// Browser push subscriptions (sent by layout.ejs). The email newsletter form
// also posts to /subscribe, so let that fall through to subscribeRoutes.
router.post("/subscribe", async (req, res, next) => {
  const subscription = req.body;
  if (!subscription || !subscription.endpoint) return next();

  await pool.query(
    "INSERT INTO subscriptions (endpoint, keys, created_at) VALUES ($1, $2, NOW()) ON CONFLICT (endpoint) DO NOTHING",
    [subscription.endpoint, JSON.stringify(subscription.keys)]
  );
  res.sendStatus(201);
});
module.exports = router;