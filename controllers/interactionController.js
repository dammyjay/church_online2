const pool = require("../models/db");
const foulWords = [
  "ass",
  "asshole",
  "bastard",
  "bitch",
  "bloody",
  "bollocks",
  "bullshit",
  "crap",
  "cunt",
  "damn",
  "dick",
  "douche",
  "fag",
  "fuck",
  "fucking",
  "goddamn",
  "hell",
  "idiot",
  "jerk",
  "motherfucker",
  "nigga",
  "nigger",
  "piss",
  "prick",
  "pussy",
  "retard",
  "shit",
  "slut",
  "stupid",
  "twat",
  "wanker",
  "whore",
  "mumu",
  "ode",
  "olodo",
  "ashawo",
  "yeye",
  "idiot",
  "nonsense",
  "madman",
  "craze",
  "fool",
  "ewu",
  "witch",
  "goat",
  "thief",
  "barawo",
  "were",
  "ogbanje",
  "akpos",
  "agbaya",
  "shameless",
  "bastid",
];

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

// exports.addComment = async (req, res) => {
//   const { contentType, contentId, comment } = req.body;
//   const userId = req.session.user?.id;
//   const created_at = new Date();

//   await pool.query(
//     "INSERT INTO comments (user_id, content_type, content_id, comment, created_at) VALUES ($1, $2, $3, $4, $5)",
//     [userId, contentType, contentId, comment, created_at]
//   );
//   res.json({ success: true });
// };

// exports.addComment = async (req, res) => {
//   const { contentType, contentId, comment } = req.body;
//   const userId = req.session.user?.id;
//   const created_at = new Date();

//   // Normalize the comment to lowercase for checking
//   const lowerComment = comment.toLowerCase();

//   // Check if comment contains any foul word
//   const hasFoulWord = foulWords.some((word) => lowerComment.includes(word));

//   if (hasFoulWord) {
//     return res.status(400).json({
//       success: false,
//       message:
//         "Your comment contains inappropriate language and was not submitted.",
//     });
//   }

//   try {
//     await pool.query(
//       "INSERT INTO comments (user_id, content_type, content_id, comment, created_at) VALUES ($1, $2, $3, $4, $5)",
//       [userId, contentType, contentId, comment, created_at]
//     );

//     res.json({ success: true });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };

exports.addComment = async (req, res) => {
  const { contentType, contentId, comment } = req.body;
  const userId = req.session.user?.id;
  const created_at = new Date();

  const lowerComment = comment.toLowerCase();

  // Detect the specific foul word used
  const matchedFoulWord = foulWords.find((word) =>
    new RegExp(`\\b${word}\\b`, "i").test(lowerComment)
  );

  if (matchedFoulWord) {
    return res.status(400).json({
      success: false,
      message: `Your comment contains the word "${matchedFoulWord}" which is not allowed.`,
    });
  }

  try {
    await pool.query(
      "INSERT INTO comments (user_id, content_type, content_id, comment, created_at) VALUES ($1, $2, $3, $4, $5)",
      [userId, contentType, contentId, comment, created_at]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
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
