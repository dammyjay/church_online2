const pool = require('../models/db');

// exports.showVideos = async (req, res) => {
//     const result = await pool.query('SELECT * FROM videos4 ORDER BY created_at3 DESC');
//   res.render('admin/videos', { videos: result.rows });
// };

exports.showSearchVideos = async (req, res) => {
  try {
    // const search = req.query.search;
    const infoResult = await pool.query(
      'SELECT * FROM ministry_info ORDER BY id DESC LIMIT 1',
    );
    const info = infoResult.rows[0] || {};
    const search = req.query.search || '';
    let result;
    // let videosResult;
if (search) {
  result = await pool.query(
    'SELECT * FROM videos4 WHERE LOWER(title) LIKE $1 ORDER BY created_at3 DESC',
    [`%${search.toLowerCase()}%`]
  );
} else {
  result = await pool.query('SELECT * FROM videos4 ORDER BY created_at3 DESC');
}

res.render('admin/videos', {
  info,
  videos: result.rows,
  search // ✅ This allows <%= search %> to work in videos.ejs
});

  } catch (err) {
    console.error('Error searching videos:', err);
    res.status(500).send('Server Error');
  }
};

exports.saveVideo = async (req, res) => {
  const { title, youtube_url, description } = req.body;
  const created_at3 = new Date(); // Create timestamp in JS
  // await pool.query('INSERT INTO videos4 (title, youtube_url, description) VALUES ($1, $2, $3)', [title, youtube_url, description]);
  await pool.query('INSERT INTO videos4 (title, youtube_url, description, created_at3) VALUES ($1, $2, $3, $4)', [title, youtube_url, description, created_at3]);
  res.redirect('/admin/videos');
};

exports.showEditForm = async (req, res) => {
  const id = req.params.id;
  const result = await pool.query('SELECT * FROM videos4 WHERE id = $1', [id]);
  if (result.rows.length === 0) return res.status(404).send('Video not found');
  res.render('admin/editVideo', { video: result.rows[0] });
};

exports.updateVideo = async (req, res) => {
  const id = req.params.id;
  const { title, youtube_url } = req.body;
  await pool.query('UPDATE videos4 SET title = $1, youtube_url = $2 WHERE id = $3', [title, youtube_url, id]);
  res.redirect('/admin/videos');
};

exports.deleteVideo = async (req, res) => {
  const id = req.params.id;
  await pool.query('DELETE FROM videos4 WHERE id = $1', [id]);
  res.redirect('/admin/videos');
};


