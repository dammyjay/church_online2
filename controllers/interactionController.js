const pool = require("../models/db");

exports.toggleLike = async (req, res) => {
  const { contentType, contentId } = req.body;
  const userId = req.session.user?.id;

  const existing = await pool.query(
    "SELECT * FROM likes WHERE user_id = $1 AND content_type = $2 AND content_id = $3",
    [userId, contentType, contentId]
  );

  if (existing.rows.length > 0) {
    await pool.query(
      "DELETE FROM likes WHERE user_id = $1 AND content_type = $2 AND content_id = $3",
      [userId, contentType, contentId]
    );
    return res.json({ liked: false });
  } else {
    await pool.query(
      "INSERT INTO likes (user_id, content_type, content_id) VALUES ($1, $2, $3)",
      [userId, contentType, contentId]
    );
    return res.json({ liked: true });
  }
};

exports.getLikes = async (req, res) => {
  const { type, id } = req.params;
  const result = await pool.query(
  'SELECT u.fullname FROM likes l JOIN users2 u ON u.id = l.user_id WHERE l.content_type = $1 AND l.content_id = $2,'
  [type, id]
  );
  res.json(result.rows);
  };

exports.addComment = async (req, res) => {
  const { contentType, contentId, comment } = req.body;
  const userId = req.session.user?.id;
  const created_at = new Date();

  await pool.query(
    "INSERT INTO comments (user_id, content_type, content_id, comment, created_at) VALUES ($1, $2, $3, $4, $5)",
    [userId, contentType, contentId, comment, created_at]
  );
  res.json({ success: true });
};

exports.fetchComments = async (req, res) => {
  const { type, id } = req.params;

  const result = await pool.query(
    `SELECT c.*, u.fullname, u.profile_picture 
     FROM comments c 
     JOIN users2 u ON c.user_id = u.id 
     WHERE c.content_type = $1 AND c.content_id = $2 
     ORDER BY c.created_at DESC`,
    [type, id]
  );

  res.json(result.rows);
};
