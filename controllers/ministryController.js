const pool = require('../models/db');
const cloudinary = require("../utils/cloudinary");
const fs = require("fs");

exports.showForm = async (req, res) => {
  const result = await pool.query('SELECT * FROM ministry_info LIMIT 1');
  res.render('admin/ministry', { info: result.rows[0], title: 'Ministry info'  });
};

// exports.saveInfo = async (req, res) => {
//     const { vision, mission, history } = req.body;
//     // const logo_url = req.file ? req.file.path : ''; // Cloudinary file URL

//       // ✅ Check if file was uploaded
//   const logo_url = req.file ? req.file.path : null;
//   const result = await pool.query('SELECT * FROM ministry_info');

//   if (result.rows.length === 0) {
//     // Insert
//     await pool.query(
//       'INSERT INTO ministry_info (logo_url, vision, mission, history) VALUES ($1, $2, $3, $4)',
//       [logo_url, vision, mission, history]
//     );
//   } else {
//     // Update
//     await pool.query(
//       'UPDATE ministry_info SET logo_url = $1, vision = $2, mission = $3, history = $4 WHERE id = $5',
//       [logo_url, vision, mission, history, result.rows[0].id]
//     );
//     }
//     console.log(req.file);

//   res.redirect('/admin/ministry');
// };

// exports.saveInfo = async (req, res) => {
//   const { vision, mission, history } = req.body;
//   let logo_url = null;
//   let hero_image_url = null;

//   // Upload logo if provided
//   if (req.files && req.files.logo) {
//     const logoPath = req.files.logo[0].path;
//     const logoUpload = await cloudinary.uploader.upload(logoPath, {
//       folder: "ministry_logos",
//     });
//     logo_url = logoUpload.secure_url;
//     fs.unlinkSync(logoPath); // Remove temp file
//   }

//   // Get uploaded file URLs from Cloudinary
//   if (req.files && req.files.logo && req.files.logo[0]) {
//     logo_url = req.files.logo[0].path; // Cloudinary URL
//   }
//   if (req.files && req.files.heroImage && req.files.heroImage[0]) {
//     hero_image_url = req.files.heroImage[0].path; // Cloudinary URL
//   }

//   // Get current info
//   const result = await pool.query(
//     "SELECT * FROM ministry_info ORDER BY id DESC LIMIT 1"
//   );
//   if (result.rows.length === 0) {
//     // Insert
//     await pool.query(
//       "INSERT INTO ministry_info (logo_url, vision, mission, history, hero_image_url) VALUES ($1, $2, $3, $4, $5)",
//       [logo_url, vision, mission, history, hero_image_url]
//     );
//   } else {
//     // Update (keep old URLs if new not provided)
//     const current = result.rows[0];
//     await pool.query(
//       "UPDATE ministry_info SET logo_url = $1, vision = $2, mission = $3, history = $4, hero_image_url = $5 WHERE id = $6",
//       [
//         logo_url || current.logo_url,
//         vision,
//         mission,
//         history,
//         hero_image_url || current.hero_image_url,
//         current.id,
//       ]
//     );
//   }

//   res.redirect("/admin/ministry");
// };


exports.saveInfo = async (req, res) => {
  const { vision, mission, history, marquee_message } = req.body;
  let logo_url = null;
  let hero_image_url = null;

  // Upload logo if provided
  if (req.files && req.files.logo && req.files.logo[0]) {
    const logoPath = req.files.logo[0].path;
    const logoUpload = await cloudinary.uploader.upload(logoPath, {
      folder: "ministry_logos",
    });
    logo_url = logoUpload.secure_url;
    fs.unlinkSync(logoPath); // Remove temp file
  }

  // Upload hero image if provided
  if (req.files && req.files.heroImage && req.files.heroImage[0]) {
    const heroPath = req.files.heroImage[0].path;
    const heroUpload = await cloudinary.uploader.upload(heroPath, {
      folder: "hero_images",
    });
    hero_image_url = heroUpload.secure_url;
    fs.unlinkSync(heroPath); // Remove temp file
  }

  // Get current info
  const result = await pool.query(
    "SELECT * FROM ministry_info ORDER BY id DESC LIMIT 1"
  );
  if (result.rows.length === 0) {
    // Insert
    await pool.query(
      "INSERT INTO ministry_info (logo_url, vision, mission, history, hero_image_url, marquee_message) VALUES ($1, $2, $3, $4, $5, $6)",
      [logo_url, vision, mission, history, hero_image_url, marquee_message]
    );
  } else {
    // Update (keep old URLs if new not provided)
    const current = result.rows[0];
    await pool.query(
      "UPDATE ministry_info SET logo_url = $1, vision = $2, mission = $3, history = $4, hero_image_url = $5, marquee_message =$6 WHERE id = $7",
      [
        logo_url || current.logo_url,
        vision,
        mission,
        history,
        hero_image_url || current.hero_image_url,
        marquee_message || current.marquee_message || '',
        current.id,
      ]
    );
  }

  res.redirect("/admin/ministry");
};

exports.showForm = async (req, res) => {
  try {
    // Get latest ministry info
    const result = await pool.query('SELECT * FROM ministry_info ORDER BY id DESC LIMIT 1');
    const info = result.rows[0] || {};

    res.render('admin/ministry', { info, title: 'Ministry info'  });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
};