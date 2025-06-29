const pool = require("../models/db");
const cloudinary = require("../utils/cloudinary");
const fs = require("fs");

// exports.showDemoVideos = async (req, res) => {
//   const result = await pool.query(
//     "SELECT * FROM demo_videos ORDER BY created_at DESC"
//   );
//   const info =
//     (await pool.query("SELECT * FROM ministry_info ORDER BY id DESC LIMIT 1"))
//       .rows[0] || {};
//   res.render("admin/demoVideos", { videos: result.rows, info });
// };

exports.showDemoVideos = async (req, res) => {
  try {
    const infoResult = await pool.query(
      "SELECT * FROM ministry_info ORDER BY id DESC LIMIT 1"
    );
    const videoResult = await pool.query(
      "SELECT * FROM demo_videos2 ORDER BY created_at DESC"
    );

    res.render("admin/demoVideos", {
      info: infoResult.rows[0] || {},
      videos: videoResult.rows || [],
    });
  } catch (err) {
    console.error("Error loading demo videos:", err);
    res.status(500).send("Server Error");
  }
};
  

// exports.saveDemoVideo = async (req, res) => {
//   const { title, embed_url, description } = req.body;
//   await pool.query(
//     "INSERT INTO demo_videos (title, embed_url, description) VALUES ($1, $2, $3)",
//     [title, embed_url, description]
//   );
//   res.redirect("/admin/demo-videos");
// };

exports.saveDemoVideo = async (req, res) => {
  const { title, description, youtube_url } = req.body;
    let embed_url = null;
    const created_at = new Date();

  try {
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        resource_type: "video",
        folder: "demo_videos",
      });
      embed_url = result.secure_url;

      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    }

    await pool.query(
      "INSERT INTO demo_videos2 (title, description, embed_url, youtube_url, created_at) VALUES ($1, $2, $3, $4, $5)",
      [title, description, embed_url, youtube_url, created_at]
    );

    res.redirect("/admin/demo-videos");
  } catch (err) {
    console.error("Demo video upload error:", err);
    res.status(500).send("Upload failed");
  }
};


exports.update = async (req, res) => {
  const { id } = req.params;
  const { title, youtube_url, description } = req.body;
  let embed_url = req.body.existing_url;

  if (req.file) {
    const uploadResult = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "video",
      folder: "demo_videos",
    });
    embed_url = uploadResult.secure_url;
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
  }

  await pool.query(
    "UPDATE demo_videos2 SET title = $1, youtube_url = $2, embed_url = $3, description = $4 WHERE id = $5",
    [title, youtube_url, embed_url, description, id]
  );

  res.redirect("/admin/demo-videos");
};

exports.delete = async (req, res) => {
  const id = req.params.id;
  await pool.query("DELETE FROM demo_videos2 WHERE id = $1", [id]);
  res.redirect("/admin/demo-videos");
};


exports.getPublicDemoVideos = async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM demo_videos2 ORDER BY created_at DESC"
  );
  return result.rows;
};
