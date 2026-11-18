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

    await pool.query(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id SERIAL PRIMARY KEY,
        endpoint TEXT NOT NULL,
        keys TEXT NOT NULL
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id SERIAL PRIMARY KEY,
        endpoint TEXT UNIQUE,
        keys JSONB,
        created_at TIMESTAMP
      );
    `);

    // Push notifications are sent from `subscriptions`; copy over any
    // browsers that were saved to the old `push_subscriptions` table
    try {
      await pool.query(`
        INSERT INTO subscriptions (endpoint, keys, created_at)
        SELECT endpoint, keys::jsonb, NOW() FROM push_subscriptions
        ON CONFLICT (endpoint) DO NOTHING;
      `);
    } catch (err) {
      console.error("❌ Error copying push_subscriptions:", err.message);
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS devotionals (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        scripture TEXT,
        content TEXT NOT NULL,
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        sheduled_at TIMESTAMP
      );

      ALTER TABLE devotionals
      ADD COLUMN IF NOT EXISTS sent_to_telegram BOOLEAN DEFAULT false;

    `);

    // Older code inserted devotionals without created_at (and the live column had
    // no default). Add the default and fill gaps from scheduled_at where possible.
    try {
      await pool.query(`
        ALTER TABLE devotionals ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;
        UPDATE devotionals SET created_at = scheduled_at
        WHERE created_at IS NULL AND scheduled_at IS NOT NULL;
      `);
    } catch (err) {
      console.error("❌ Error fixing devotionals.created_at:", err.message);
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS testimonies (
        id SERIAL PRIMARY KEY,
        name TEXT,
        email TEXT,
        message TEXT,
        is_published BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log(
      "✅ All tables are ready now."
    );
  } catch (err) {
    console.error("❌ Error creating tables:", err.message);
  }
}

module.exports = createTables;
