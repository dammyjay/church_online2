const pool = require("../models/db");
const cloudinary = require("../utils/cloudinary");
const fs = require("fs");
const webpush = require("../utils/webpushConfig");
const sendDevotionalToTelegram = require("../utils/telegram");

exports.showDevotionals = async (req, res) => {
  const infoResult = await pool.query(
    "SELECT * FROM ministry_info ORDER BY id DESC LIMIT 1"
  );
  const devotionals = await pool.query(
    "SELECT * FROM devotionals ORDER BY created_at DESC NULLS LAST, id DESC"
  );
  res.render("admin/devotionals", {
    info: infoResult.rows[0] || {},
    devotionals: devotionals.rows,
  });
};

exports.showUploadForm = async (req, res) => {
  try {
    const infoResult = await pool.query(
      "SELECT * FROM ministry_info ORDER BY id DESC LIMIT 1"
    );
    const devotionalResult = await pool.query(
      "SELECT * FROM devotionals ORDER BY created_at DESC NULLS LAST, id DESC"
    );

    const info = infoResult.rows[0] || {};
    const devotionals = devotionalResult.rows;

    res.render("admin/devotionals", { info, devotionals });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error loading devotionals");
  }
};

// exports.saveDevotional = async (req, res) => {
//   const { title, scripture, content, scheduled_at } = req.body;
//   let imageUrl = null;

//   if (req.file) {
//     const result = await cloudinary.uploader.upload(req.file.path, {
//       folder: "devotionals",
//     });
//     imageUrl = result.secure_url;
//     if (req.file.path && fs.existsSync(req.file.path)) {
//       fs.unlinkSync(req.file.path);
//     }
//   }

//   const visible = scheduled_at ? false : true; // Show now if not scheduled

//   await pool.query(
//     `INSERT INTO devotionals (title, scripture, content, image_url, scheduled_at, created_at, visible)
//      VALUES ($1, $2, $3, $4, $5, NOW(), $6)`,
//     [title, scripture, content, imageUrl, scheduled_at || null, visible]
//   );

  

//   res.redirect("/admin/devotionals");
// };



exports.saveDevotional = async (req, res) => {
  const { title, scripture, content, scheduled_at } = req.body;
  let imageUrl = null;

  if (req.file) {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "devotionals",
    });
    imageUrl = result.secure_url;
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
  }

  const visible = scheduled_at ? false : true;

  const result = await pool.query(
    `
    INSERT INTO devotionals
    (title, scripture, content, image_url, scheduled_at, visible, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, NOW())
    RETURNING *
    `,
    [title, scripture, content, imageUrl, scheduled_at || null, visible]
  );

  const devotional = result.rows[0];

  // ✅ Send immediately if visible now
  if (visible) {
    await sendDevotionalToTelegram(devotional);

    await pool.query(
      "UPDATE devotionals SET sent_to_telegram = true WHERE id = $1",
      [devotional.id]
    );
  }

  res.redirect("/admin/devotionals");
};


// Editing happens in the modal on admin/devotionals, so there is no separate edit page
exports.updateDevotional = async (req, res) => {
  const id = req.params.id;
  const { title, scripture, content, scheduled_at, existingUrl } = req.body;

  let imageUrl = existingUrl;

  if (req.file) {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "devotionals",
    });
    imageUrl = result.secure_url;
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
  }

  await pool.query(
    "UPDATE devotionals SET title = $1, scripture = $2, content = $3, scheduled_at = $4, image_url = $5 WHERE id = $6",
    [title, scripture, content, scheduled_at || null, imageUrl || null, id]
  );

  res.redirect("/admin/devotionals");
};

exports.deleteDevotional = async (req, res) => {
  const id = req.params.id;
  await pool.query("DELETE FROM devotionals WHERE id = $1", [id]);
  res.redirect("/admin/devotionals");
};
