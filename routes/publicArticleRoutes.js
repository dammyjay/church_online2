const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');

router.get('/articles/:id', articleController.showSingleArticle);

module.exports = router;