const pool = require('../models/db');

exports.showForm = async (req, res) => {
  const result = await pool.query('SELECT * FROM ministry_info LIMIT 1');
  res.render('admin/ministry', { info: result.rows[0] });
};

exports.saveInfo = async (req, res) => {
    const { vision, mission, history } = req.body;
    // const logo_url = req.file ? req.file.path : ''; // Cloudinary file URL

      // ✅ Check if file was uploaded
  const logo_url = req.file ? req.file.path : null;
  const result = await pool.query('SELECT * FROM ministry_info');

  if (result.rows.length === 0) {
    // Insert
    await pool.query(
      'INSERT INTO ministry_info (logo_url, vision, mission, history) VALUES ($1, $2, $3, $4)',
      [logo_url, vision, mission, history]
    );
  } else {
    // Update
    await pool.query(
      'UPDATE ministry_info SET logo_url = $1, vision = $2, mission = $3, history = $4 WHERE id = $5',
      [logo_url, vision, mission, history, result.rows[0].id]
    );
    }
    console.log(req.file);

  res.redirect('/admin/ministry');
};

exports.showForm = async (req, res) => {
  try {
    // Get latest ministry info
    const result = await pool.query('SELECT * FROM ministry_info ORDER BY id DESC LIMIT 1');
    const info = result.rows[0] || {};

    res.render('admin/ministry', { info });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
};