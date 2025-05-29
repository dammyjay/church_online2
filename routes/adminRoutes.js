const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const ministryController = require("../controllers/ministryController");
const articleController = require("../controllers/articleController");
const galleryController = require('../controllers/galleryController');



const multer = require('multer');
// const upload = multer({ dest: 'uploads/' }); // temp local storage
const upload = require("../middlewares/upload");

router.get("/login", adminController.showLogin);
router.post("/login", adminController.login);
router.get("/dashboard", adminController.dashboard);
router.get("/logout", adminController.logout);

router.get("/users/edit/:id", adminController.editUserForm);
router.post("/users/delete/:id", adminController.deleteUser);
router.post("/users/edit/:id", adminController.updateUser);



// Ministry Info routes
router.get("/ministry", ministryController.showForm);

// POST form with multiple file uploads mini
router.post(
  "/ministry",
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "heroImage", maxCount: 1 },
  ]),
  ministryController.saveInfo
);

// const galleryController = require('../controllers/galleryController');

router.get('/gallery', galleryController.showGalleryUpload); // show the form
router.post('/gallery/upload', upload.single('image'), galleryController.uploadImage); // handle upload

// Show edit form
router.get('/gallery/edit/:id', galleryController.showEditImage);
// Handle edit form submission
router.post('/gallery/edit/:id', upload.single('image'), galleryController.editImage);
// Handle delete
router.post('/gallery/delete/:id', galleryController.deleteImage);

// Show category management page
router.get('/gallery/categories', galleryController.showCategories);

// Handle new category creation
router.post('/gallery/categories', galleryController.createCategory);

// (Optional) Handle category deletion
router.post('/gallery/categories/delete/:id', galleryController.deleteCategory);

// Handle category edit form submission
router.post('/gallery/categories/edit/:id', galleryController.editCategory);


// router.get('/articles', articleController.showArticles);
router.get("/articles", articleController.showSearchArticles);
router.post("/articles", upload.single("image"), articleController.saveArticle);
// router.get('/articles/:id', articleController.showSingleArticle);

router.get("/articles/edit/:id", articleController.showEditForm);
router.post(
  "/articles/edit/:id",
  upload.single("image"),
  articleController.updateArticle
);
router.post("/articles/delete/:id", articleController.deleteArticle);

// Temporary route to add `created_at` column
router.get("/fix-created-at", async (req, res) => {
  try {
    await pool.query(`
        ALTER TABLE articles
        ADD COLUMN IF NOT EXISTS created_at4 TIMESTAMPTZ DEFAULT NOW();
      `);
    res.send("✅ created_at column added successfully!");
  } catch (err) {
    console.error(err);
    res.status(500).send("❌ Failed to add column.");
  }
});

router.get("/forgot-password", adminController.showForgotPasswordForm);
router.post("/forgot-password", adminController.handleForgotPassword);
router.get("/reset-password/:token", adminController.showResetPasswordForm);
router.post("/reset-password/:token", adminController.handleResetPassword);

// routes for announcements
router.get("/announcements", adminController.showAnnouncements);
router.post(
  "/announcements",
  upload.single("flyer"),
  adminController.createAnnouncement
);

router.post("/announcements/delete/:id", adminController.deleteAnnouncement);
router.get("/announcements/edit/:id", adminController.showEditAnnouncement);
router.post(
  "/announcements/edit/:id",
  upload.single("flyer"),
  adminController.editAnnouncement
);
module.exports = router;
