const express = require("express");
const router = express.Router();
const pool = require("../models/db");
const articleController = require("../controllers/articleController");

// router.get('/videos', videoController.showVideos);

router.get("/", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0]; // 👈 Fix: define today

    const [infoResult, articlesResult, videosResult] = await Promise.all([
      pool.query("SELECT * FROM ministry_info ORDER BY id DESC LIMIT 1"),
      pool.query("SELECT * FROM articles ORDER BY created_at3 DESC LIMIT 3"),
      pool.query("SELECT * FROM videos4 ORDER BY created_at3 DESC LIMIT 3"),
    ]);
    const faqsResult = await pool.query(
      "SELECT * FROM faqs WHERE is_published = true ORDER BY created_at DESC LIMIT 5"
    );

    // const TestimonyResult = await pool.query(
    //   "SELECT * FROM testimonies WHERE is_published = true ORDER BY created_at DESC LIMIT 5"
    // );

    const TestimonyResult = await pool.query(
      `
      SELECT * FROM testimonies 
      WHERE is_published = true
      ORDER BY md5($1 || id::text)
      LIMIT 5
    `,
      [today]
    );
    // const randomImagesResult = await pool.query(
    //   "SELECT url FROM gallery_images ORDER BY RANDOM() LIMIT 5"
    // );
    const info = infoResult.rows[0];
    const articles = articlesResult.rows;
    const faqs = faqsResult.rows;
    const testimonies = TestimonyResult.rows;
    const annResult = await pool.query(
      // "SELECT * FROM announcements ORDER BY event_date DESC LIMIT 1"
      "SELECT * FROM announcements WHERE is_visible = true ORDER BY event_date DESC LIMIT 1"
    );
    const announcement = annResult.rows[0];
    // const carouselImages = randomImagesResult.rows.map((row) => row.url);

    // fetch demo videos
    // const demoVideos = await demoVideoController.getPublicDemoVideos();
    const demoResult = await pool.query(
      "SELECT * FROM demo_videos2 ORDER BY created_at DESC"
    );
    const demoVideos = demoResult.rows;
    console.log("Demo Videos:", demoVideos);


const devoRes = await pool.query(
  `
  SELECT *
  FROM devotionals
  WHERE visible = true
    AND (
      DATE(scheduled_at) = $1
      OR (scheduled_at IS NULL AND DATE(created_at) = $1)
    )
  ORDER BY scheduled_at DESC NULLS LAST, created_at DESC
  LIMIT 1
  `,
  [today]
);


const devotional = devoRes.rows[0] || null;

    const allImagesResult = await pool.query("SELECT url FROM gallery_images");
    const allImages = allImagesResult.rows.map((row) => row.url);

    // Deterministically shuffle based on the day
    function getDailyImages(images, count) {
      const today = new Date();
      let seed =
        today.getFullYear() * 10000 +
        (today.getMonth() + 1) * 100 +
        today.getDate();
      // Simple seeded shuffle (Fisher-Yates with seed)
      let arr = images.slice();
      let random = function () {
        var x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
      };
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr.slice(0, count);
    }

    const carouselImages = getDailyImages(allImages, 5);

    console.log(
      "Raw video URLs:",
      videosResult.rows.map((v) => v.youtube_url)
    );
    const videos = videosResult.rows.map((video) => {
      let embedUrl = video.youtube_url;

      if (!embedUrl.includes("youtube.com/embed/")) {
        // Full YouTube URL
        const match = embedUrl.match(
          /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/
        );
        if (match) {
          embedUrl = `https://www.youtube.com/embed/${match[1]}`;
        } else {
          // Shortened youtu.be URL
          // const shortMatch = embedUrl.match(/(?:https?:\/\/)?youtu\.be\/([^&]+)/);
          const shortMatch = embedUrl.match(
            /(?:https?:\/\/)?youtu\.be\/([\w-]{11})/
          );
          if (shortMatch) {
            embedUrl = `https://www.youtube.com/embed/${shortMatch[1]}`;
          } else {
            // If just a video ID without domain
            if (/^[\w-]{11}$/.test(embedUrl)) {
              embedUrl = `https://www.youtube.com/embed/${embedUrl}`;
            } else {
              // fallback to empty or invalid URL if no match
              embedUrl = "";
            }
          }
        }
      }

      return {
        ...video,
        embed_url: embedUrl,
      };
    });
    console.log(
      videos.map((v) => ({ title: v.title, embed_url: v.embed_url }))
    );

    // Add this line to pass login status to EJS
    const isLoggedIn = !!req.session.user; // or whatever property you use for login
    const profilePic = req.session.user ? req.session.user.profile_pic : null;
    console.log("User session:", req.session.user);
    console.log("Is user logged in:", isLoggedIn);
    res.render("home", {
      info,
      title: "Ministry Home",
      articles,
      videos,
      faqs,
      testimonies,
      demoVideos,
      devotional,
      subscribed: req.query.subscribed,
      isLoggedIn: !!req.session.user,
      profilePic,
      carouselImages,
      announcement,
    });
  } catch (err) {
    console.error("Error fetching homepage data:", err);
    res.status(500).send("Server Error");
  }
});

router.get("/articles/:id", articleController.showSingleArticle);

router.get("/home2", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0]; // 👈 Fix: define today

    const [infoResult, articlesResult, videosResult] = await Promise.all([
      pool.query("SELECT * FROM ministry_info ORDER BY id DESC LIMIT 1"),
      pool.query("SELECT * FROM articles ORDER BY created_at3 DESC LIMIT 3"),
      pool.query("SELECT * FROM videos4 ORDER BY created_at3 DESC LIMIT 3"),
    ]);
    const faqsResult = await pool.query(
      "SELECT * FROM faqs WHERE is_published = true ORDER BY created_at DESC LIMIT 5"
    );

    // const TestimonyResult = await pool.query(
    //   "SELECT * FROM testimonies WHERE is_published = true ORDER BY created_at DESC LIMIT 5"
    // );

    const TestimonyResult = await pool.query(
      `
      SELECT * FROM testimonies 
      WHERE is_published = true
      ORDER BY md5($1 || id::text)
      LIMIT 5
    `,
      [today]
    );

    const info = infoResult.rows[0];
    const articles = articlesResult.rows;
    const testimonies = TestimonyResult.rows;
    const faqs = faqsResult.rows;

    const allImagesResult = await pool.query("SELECT url FROM gallery_images");
    const allImages = allImagesResult.rows.map((row) => row.url);
    const annResult = await pool.query(
      // "SELECT * FROM announcements ORDER BY event_date DESC LIMIT 1"
      "SELECT * FROM announcements WHERE is_visible = true ORDER BY event_date DESC LIMIT 1"
    );
    const announcement = annResult.rows[0];
    // Deterministically shuffle based on the day
    function getDailyImages(images, count) {
      const today = new Date();
      let seed =
        today.getFullYear() * 10000 +
        (today.getMonth() + 1) * 100 +
        today.getDate();
      // Simple seeded shuffle (Fisher-Yates with seed)
      let arr = images.slice();
      let random = function () {
        var x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
      };
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr.slice(0, count);
    }

    const carouselImages = getDailyImages(allImages, 5);

    // demo videos
    const demoResult = await pool.query(
      "SELECT * FROM demo_videos2 ORDER BY created_at DESC"
    );
    const demoVideos = demoResult.rows;
    console.log("Demo Videos:", demoVideos);

    //fetch daily devotionals
    const devoRes = await pool.query(
      "SELECT * FROM devotionals WHERE visible = true ORDER BY created_at DESC LIMIT 1"
    );
    const devotional = devoRes.rows[0];

    console.log(
      "Raw video URLs:",
      videosResult.rows.map((v) => v.youtube_url)
    );
    const videos = videosResult.rows.map((video) => {
      let embedUrl = video.youtube_url;

      if (!embedUrl.includes("youtube.com/embed/")) {
        // Full YouTube URL
        const match = embedUrl.match(
          /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/
        );
        if (match) {
          embedUrl = `https://www.youtube.com/embed/${match[1]}`;
        } else {
          // Shortened youtu.be URL
          // const shortMatch = embedUrl.match(/(?:https?:\/\/)?youtu\.be\/([^&]+)/);
          const shortMatch = embedUrl.match(
            /(?:https?:\/\/)?youtu\.be\/([\w-]{11})/
          );
          if (shortMatch) {
            embedUrl = `https://www.youtube.com/embed/${shortMatch[1]}`;
          } else {
            // If just a video ID without domain
            if (/^[\w-]{11}$/.test(embedUrl)) {
              embedUrl = `https://www.youtube.com/embed/${embedUrl}`;
            } else {
              // fallback to empty or invalid URL if no match
              embedUrl = "";
            }
          }
        }
      }

      return {
        ...video,
        embed_url: embedUrl,
      };
    });
    console.log(
      videos.map((v) => ({ title: v.title, embed_url: v.embed_url }))
    );

    // Add this line to pass login status to EJS
    const isLoggedIn = !!req.session.user; // or whatever property you use for login
    const profilePic = req.session.user ? req.session.user.profile_pic : null;
    console.log("User session:", req.session.user);
    console.log("Is user logged in:", isLoggedIn);
    console.log("Profile picture URL:", profilePic);
    res.render("home2", {
      info,
      articles,
      videos,
      faqs,
      testimonies,
      devotional,
      demoVideos,
      subscribed: req.query.subscribed,
      title: "Home",
      isLoggedIn,
      profilePic,
      carouselImages,
      announcement,
    });
  } catch (err) {
    console.error("Error fetching homepage data:", err);
    res.status(500).send("Server Error");
  }
});

router.get("/articles", async (req, res) => {
  try {
    const search = req.query.search || "";
    let result;
    if (search) {
      result = await pool.query(
        "SELECT * FROM articles WHERE LOWER(title) LIKE $1 ORDER BY created_at3 DESC",
        [`%${search.toLowerCase()}%`]
      );
    } else {
      result = await pool.query(
        "SELECT * FROM articles ORDER BY created_at3 DESC"
      );
    }

    const articles = result.rows;

    // Fetch likes for all articles
    const likesResult = await pool.query(`
  SELECT content_id, COUNT(*) as count
  FROM likes
  WHERE content_type = 'article'
  GROUP BY content_id
`);

    const likeMap = {};
    likesResult.rows.forEach((row) => {
      likeMap[row.content_id] = parseInt(row.count);
    });

    // Merge comment counts into articles
    articles.forEach((article) => {
      article.like_count = likeMap[article.id] || 0;
    });

    const articles2 = result.rows;

    // Fetch comment for all articles
    const commentResult = await pool.query(`
    SELECT content_id, COUNT(*) as count
    FROM comments
    WHERE content_type = 'article'
    GROUP BY content_id
  `);

    const commentMap = {};
    commentResult.rows.forEach((row) => {
      commentMap[row.content_id] = parseInt(row.count);
    });

    // Merge comment counts into articles
    articles2.forEach((article) => {
      article.comment_count = commentMap[article.id] || 0;
    });

    res.render("allArticles", {
      // articles: result.rows,
      articles,
      articles2,
      search, // ⬅️ pass search value to EJS
      subscribed: req.query.subscribed,
      title: "All article",
      user: req.session.user || null,
    });
  } catch (err) {
    console.error("Error fetching public articles:", err);
    res.status(500).send("Server Error");
  }
});

router.get("/videos", async (req, res) => {
  try {
    const search = req.query.search || "";
    let result;
    if (search) {
      result = await pool.query(
        "SELECT * FROM videos4 WHERE LOWER(title) LIKE $1 ORDER BY created_at3 DESC",
        [`%${search.toLowerCase()}%`]
      );
    } else {
      result = await pool.query(
        "SELECT * FROM videos4 ORDER BY created_at3 DESC"
      );
    }

    res.render("allVideos", {
      videos: result.rows,
      search, // ⬅️ pass search value to EJS
      subscribed: req.query.subscribed,
    });
  } catch (err) {
    console.error("Error fetching public video  s:", err);
    res.status(500).send("Server Error");
  }
});

router.get("/devotionals", async (req, res) => {
  try {
    const search = req.query.search || "";
    const date = req.query.date || "";
    let result;
    if (search) {
      result = await pool.query(
        "SELECT * FROM devotionals WHERE LOWER(title) LIKE $1 ORDER BY created_at DESC",
        [`%${search.toLowerCase()}%`]
      );
    } else if (date) {
      result = await pool.query(
        "SELECT * FROM devotionals WHERE created_at::date = $1 ORDER BY created_at DESC",
        [date]
      );
    } else {
      result = await pool.query(
        "SELECT * FROM devotionals ORDER BY created_at DESC"
      );
    }

    res.render("allDevotionals", {
      devotionals: result.rows,
      search, // ⬅️ pass search value to EJS
      date, // ⬅️ pass date value to EJS
      title: "All Devotionals",
      subscribed: req.query.subscribed,
    });
  } catch (err) {
    console.error("Error fetching public video  s:", err);
    res.status(500).send("Server Error");
  }
});

router.get("/signup", async (req, res) => {
  // const result = await pool.query('SELECT * FROM videos4 ORDER BY created_at3 DESC');

  res.render("signup", { error: null, title: "Signup" });
});

router.get("/faq", async (req, res) => {
  try {
    const search = req.query.search || "";
    let faqResult;

    if (search) {
      faqResult = await pool.query(
        "SELECT * FROM faqs WHERE LOWER(question) LIKE $1 ORDER BY created_at DESC",
        [`%${search.toLowerCase()}%`]
      );
    } else {
      faqResult = await pool.query(
        "SELECT * FROM faqs ORDER BY created_at DESC"
      );
    }

    const infoResult = await pool.query(
      "SELECT * FROM ministry_info ORDER BY id DESC LIMIT 1"
    );

    res.render("faq", {
      info: infoResult.rows[0] || {},
      faqs: faqResult.rows,
      search, // pass current search back to the EJS view
      user: req.session.user || null,
    });
  } catch (err) {
    console.error("Error fetching FAQs:", err);
    res.status(500).send("Error loading FAQs");
  }
});

router.post("/faq/ask", async (req, res) => {
  const { question, email } = req.body;

  if (!question || question.trim() === "") {
    return res.redirect("/faq");
  }

  await pool.query("INSERT INTO faqs (question, email) VALUES ($1, $2)", [
    question,
    email || null,
  ]);
  res.redirect("/faq");
});

// Show Testimony Form Page (optional if part of another page)
router.get("/testimony", async (req, res) => {
  const infoResult = await pool.query(
    "SELECT * FROM ministry_info ORDER BY id DESC LIMIT 1"
  );
  const testimonyResult = await pool.query(
    "SELECT * FROM testimonies WHERE is_published = true ORDER BY id"
  );
  res.render("testimony", {
    info: infoResult.rows[0] || {},
    testimonies: testimonyResult.rows,
    title: "Submit Testimony",
  });
});

// Handle Testimony Submission
router.post("/testimony", async (req, res) => {
  const { name, email, message } = req.body;

  if (!message || !name) {
    return res.redirect("/testimony?error=Message and name are required");
  }

  await pool.query(
    "INSERT INTO testimonies (name, email, message, created_at) VALUES ($1, $2, $3, NOW())",
    [name, email || null, message]
  );

  // Optionally email admin
  const adminEmail = "imoledayoimmanuel@gmail.com";
  const subject = "New Testimony Submitted";
  const body = `<h3>New Testimony</h3><p><strong>Name:</strong> ${name}</p><p>${message}</p>`;

  try {
    await sendEmail(adminEmail, subject, body);
  } catch (err) {
    console.error("Failed to send testimony alert:", err.message);
  }

  res.redirect("/testimony?success=true");
});

// Show Published Testimonies on Home or Testimony Page
router.get("/testimonies", async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM testimonies WHERE is_published = true ORDER BY created_at DESC"
  );
  res.render("testimonies", {
    testimonies: result.rows,
    title: "Testimonies",
  });
});

// routes/publicRoutes.js
const aboutController = require("../controllers/aboutController");
router.get("/about", aboutController.showAbout);

module.exports = router;
