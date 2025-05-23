const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const upload = require('../middlewares/upload');

router.post('/signup', upload.single('profile_picture'), userController.signup);
router.get('/signup', userController.showSignup);
router.post('/verify-otp', userController.verifyOtp);
module.exports = router;