// controllers/galleryController.js
const pool = require("../models/db");
// controllers/galleryController.js
const cloudinary = require("../utils/cloudinary");
const fs = require("fs");

exports.showGalleryUpload = async (req, res) => {
  const categories = await pool.query("SELECT * FROM gallery_categories");
  const images = await pool.query("SELECT * FROM gallery_images");
  res.render("admin/gallery", {
    categories: categories.rows,
    images: images.rows,
  });
};

// Show edit form
exports.showEditImage = async (req, res) => {
  const { id } = req.params;
  const imageResult = await pool.query(
    "SELECT * FROM gallery_images WHERE id = $1",
    [id]
  );
  const categories = await pool.query("SELECT * FROM gallery_categories");
  res.render("admin/editGalleryImage", {
    image: imageResult.rows[0],
    categories: categories.rows,
  });
};

// Handle edit submission
exports.editImage = async (req, res) => {
  const { id } = req.params;
  const { category_id, caption } = req.body;
  let imageUrl = req.body.existingUrl;

  if (req.file) {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "gallery",
    });
    imageUrl = result.secure_url;
    fs.unlinkSync(req.file.path);
  }

  await pool.query(
    "UPDATE gallery_images SET url = $1, caption = $2, category_id = $3 WHERE id = $4",
    [imageUrl, caption, category_id, id]
  );
  res.redirect("/admin/gallery");
};

// Handle delete
exports.deleteImage = async (req, res) => {
  const { id } = req.params;
  await pool.query("DELETE FROM gallery_images WHERE id = $1", [id]);
  res.redirect("/admin/gallery");
};

exports.uploadImage = async (req, res) => {
  const { category_id, caption } = req.body;
  let imageUrl = null;

  if (req.file) {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "gallery",
    });
    imageUrl = result.secure_url;
    fs.unlinkSync(req.file.path); // remove temp file
  }

  await pool.query(
    "INSERT INTO gallery_images (url, caption, category_id) VALUES ($1, $2, $3)",
    [imageUrl, caption, category_id]
  );
  res.redirect("/admin/gallery");
};

// Show all categories and a form to add new ones
exports.showCategories = async (req, res) => {
  const categories = await pool.query("SELECT * FROM gallery_categories");
  res.render("admin/galleryCategories", { categories: categories.rows });
};

// Create a new category
exports.createCategory = async (req, res) => {
  const { name } = req.body;
  await pool.query("INSERT INTO gallery_categories (name) VALUES ($1)", [name]);
  res.redirect("/admin/gallery/categories");
};

// Delete a category
exports.deleteCategory = async (req, res) => {
  const { id } = req.params;
  await pool.query("DELETE FROM gallery_categories WHERE id = $1", [id]);
  res.redirect("/admin/gallery/categories");
};
