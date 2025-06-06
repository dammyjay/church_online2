const express = require('express');
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

router.post("/subscribe", async (req, res) => {
  const subscription = req.body;
  await pool.query(
    "INSERT INTO push_subscriptions (endpoint, keys) VALUES ($1, $2)",
    [subscription.endpoint, JSON.stringify(subscription.keys)]
  );
  res.sendStatus(201);
});
module.exports = router;