const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');
const requireAdmin = require('../middlewares/requireAdmin');

// Mounted at /admin
// router.get('/videos', videoController.showVideos);
router.get('/videos', requireAdmin, videoController.showSearchVideos);
router.post('/videos', requireAdmin, videoController.saveVideo);

router.get('/videos/edit/:id', requireAdmin, videoController.showEditForm);
router.post('/videos/edit/:id', requireAdmin, videoController.updateVideo);
router.post('/videos/delete/:id', requireAdmin, videoController.deleteVideo);

module.exports = router;
