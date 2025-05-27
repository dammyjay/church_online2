// controllers/aboutController.js
const pool = require("../models/db");

exports.showAbout = async (req, res) => {
  try {
    // Fetch ministry info
    const infoResult = await pool.query(
      "SELECT * FROM ministry_info ORDER BY id DESC LIMIT 1"
    );
    const info = infoResult.rows[0];

    // Fetch gallery categories and images
    const categoriesResult = await pool.query(
      "SELECT * FROM gallery_categories"
    );
    const imagesResult = await pool.query("SELECT * FROM gallery_images");

    // Fetch FAQs (optional)
    const faqsResult = await pool.query("SELECT * FROM faqs");
    const faqs = faqsResult.rows;

    // Login status
    const isLoggedIn = !!req.session.user;
    const profilePic = req.session.user ? req.session.user.profile_pic : null;

    // Newsletter subscription status (optional)
    const subscribed = req.session.subscribed || false;

    res.render("about", {
      info,
      categories: categoriesResult.rows,
      images: imagesResult.rows,
      faqs,
      isLoggedIn,
      profilePic,
      subscribed,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};
