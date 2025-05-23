const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');

// router.get('/videos', videoController.showVideos);
router.get('/videos', videoController.showSearchVideos);
router.post('/videos', videoController.saveVideo);

router.get('/videos/edit/:id', videoController.showEditForm);
router.post('/videos/edit/:id', videoController.updateVideo);
router.post('/videos/delete/:id', videoController.deleteVideo);

module.exports = router;
