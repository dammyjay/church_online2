const express = require("express");
const router = express.Router();
const interactionController = require("../controllers/interactionController");

// Likes
router.post("/like", interactionController.toggleLike);
router.get("/likes/:type/:id", interactionController.getLikes);

// Comments
router.post("/comment", interactionController.addComment);
router.get("/comments/:type/:id", interactionController.fetchComments);

module.exports = router;
