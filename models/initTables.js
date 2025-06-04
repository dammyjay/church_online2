const pool = require("./db");

async function createTables() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS likes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users2(id) ON DELETE CASCADE,
        content_type VARCHAR(10) CHECK (content_type IN ('article', 'video')),
        content_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, content_type, content_id)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users2(id) ON DELETE CASCADE,
        content_type VARCHAR(10) CHECK (content_type IN ('article', 'video')),
        content_id INTEGER NOT NULL,
        comment TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log("✅ likes and comments tables are ready.");
  } catch (err) {
    console.error("❌ Error creating tables:", err.message);
  }
}

module.exports = createTables;
