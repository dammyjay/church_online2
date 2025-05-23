const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const ministryController = require('../controllers/ministryController');
const articleController = require('../controllers/articleController');

const upload = require('../middlewares/upload');

router.get('/login', adminController.showLogin);
router.post('/login', adminController.login);
router.get('/dashboard', adminController.dashboard);
router.get('/logout', adminController.logout);

router.get('/users/edit/:id', adminController.editUserForm);
router.post('/users/delete/:id', adminController.deleteUser);
router.post('/users/edit/:id', adminController.updateUser);


// Admin dashboard
// router.get('/dashboard', (req, res) => {
//   res.render('admin/dashboard');
// });

// Ministry Info routes
router.get('/ministry', ministryController.showForm);
// POST form with file upload
router.post('/ministry', upload.single('logo'), ministryController.saveInfo);

// router.get('/articles', articleController.showArticles);
router.get('/articles', articleController.showSearchArticles);
router.post('/articles', upload.single('image'), articleController.saveArticle);
// router.get('/articles/:id', articleController.showSingleArticle);

router.get('/articles/edit/:id', articleController.showEditForm);
router.post('/articles/edit/:id', upload.single('image'), articleController.updateArticle);
router.post('/articles/delete/:id', articleController.deleteArticle);


// Temporary route to add `created_at` column
router.get('/fix-created-at', async (req, res) => {
    try {
      await pool.query(`
        ALTER TABLE articles
        ADD COLUMN IF NOT EXISTS created_at4 TIMESTAMPTZ DEFAULT NOW();
      `);
      res.send('✅ created_at column added successfully!');
    } catch (err) {
      console.error(err);
      res.status(500).send('❌ Failed to add column.');
    }
  });

module.exports = router;
