const express = require("express");
const router = express.Router();
const pool = require("../models/db");
const articleController = require("../controllers/articleController");
const { sendEmail, ADMIN_EMAIL } = require("../utils/sendEmail");
const emailTemplates = require("../utils/emailTemplates");
const { youtubeThumbnail } = require("../middlewares/pageMeta");

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
      "SELECT * FROM devotionals WHERE visible = true ORDER BY created_at DESC NULLS LAST, id DESC LIMIT 1"
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

    res.setMeta({
      title: "Articles",
      description:
        "Teachings, reflections and messages to help you grow in faith. Read the latest articles from C&S Church Online.",
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

    res.setMeta({
      title: "Videos",
      description:
        "Sermons, teachings and worship from C&S Church Online. Watch and share the latest videos.",
      image: result.rows[0] ? youtubeThumbnail(result.rows[0].youtube_url) : undefined,
    });

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
        "SELECT * FROM devotionals WHERE visible = true AND LOWER(title) LIKE $1 ORDER BY created_at DESC NULLS LAST, id DESC",
        [`%${search.toLowerCase()}%`]
      );
    } else if (date) {
      result = await pool.query(
        "SELECT * FROM devotionals WHERE visible = true AND created_at::date = $1 ORDER BY created_at DESC NULLS LAST, id DESC",
        [date]
      );
    } else {
      result = await pool.query(
        "SELECT * FROM devotionals WHERE visible = true ORDER BY created_at DESC NULLS LAST, id DESC"
      );
    }

    res.setMeta({
      title: "Daily Devotionals",
      description:
        "A daily word to strengthen your walk with God. Read today's devotional and catch up on past ones.",
    });

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

// Single devotional (shareable link)
router.get("/devotionals/:id", async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) return res.redirect("/devotionals");

  const result = await pool.query(
    "SELECT * FROM devotionals WHERE id = $1 AND visible = true",
    [id]
  );
  const devotional = result.rows[0];
  if (!devotional) return res.redirect("/devotionals");

  const moreResult = await pool.query(
    "SELECT id, title, image_url, created_at, scheduled_at FROM devotionals WHERE visible = true AND id <> $1 ORDER BY created_at DESC NULLS LAST, id DESC LIMIT 3",
    [id]
  );

  // Some older devotionals have no date at all
  const publishedOn = devotional.scheduled_at || devotional.created_at;
  const dateLabel = publishedOn
    ? new Date(publishedOn).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : "";

  res.setMeta({
    title: devotional.title,
    description:
      [devotional.scripture, devotional.content].filter((s) => s && s.trim()).join(" — ") ||
      `${dateLabel ? `Daily devotional for ${dateLabel}.` : "A daily devotional from C&S Church Online."} Read it and share the word with someone today.`,
    image: devotional.image_url,
    type: "article",
    publishedTime: devotional.scheduled_at || devotional.created_at,
  });

  res.render("devotional", {
    devotional,
    dateLabel,
    moreDevotionals: moreResult.rows,
    title: devotional.title,
  });
});

router.get("/signup", async (req, res) => {
  // const result = await pool.query('SELECT * FROM videos4 ORDER BY created_at3 DESC');

  res.setMeta({
    title: "Create an account",
    description: "Join C&S Church Online to comment, like and receive our newsletter and daily devotionals.",
  });
  res.render("signup", { error: null, title: "Signup" });
});

// /faq lists every question; /faq/:id opens and highlights one (shareable link)
async function showFaqPage(req, res) {
  try {
    const search = req.query.search || "";
    let focusFaq = null;

    if (req.params.id) {
      const id = Number.parseInt(req.params.id, 10);
      const focusResult = Number.isInteger(id)
        ? await pool.query("SELECT * FROM faqs WHERE id = $1", [id])
        : { rows: [] };
      focusFaq = focusResult.rows[0];
      if (!focusFaq) return res.redirect("/faq");
    }

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

    if (focusFaq) {
      res.setMeta({
        title: focusFaq.question,
        description: focusFaq.answer || "This question is waiting for an answer from our team.",
      });
    } else {
      res.setMeta({
        title: "Frequently Asked Questions",
        description:
          "Answers to common questions about our faith, worship and church life. Ask your own question too.",
      });
    }

    res.render("faq", {
      info: infoResult.rows[0] || {},
      faqs: faqResult.rows,
      search, // pass current search back to the EJS view
      user: req.session.user || null,
      focusId: focusFaq ? focusFaq.id : null,
    });
  } catch (err) {
    console.error("Error fetching FAQs:", err);
    res.status(500).send("Error loading FAQs");
  }
}

router.get("/faq", showFaqPage);
router.get("/faq/:id", showFaqPage);

router.post("/faq/ask", async (req, res) => {
  const question = (req.body.question || "").trim();
  const email = (req.body.email || "").trim();

  // The question comes from a rich-text editor, so check there are real words in it
  if (!question.replace(/<[^>]*>|&nbsp;/g, "").trim()) {
    return res.redirect("/faq?ask=missing-question#ask");
  }
  // An email is required: it's how the asker gets the answer
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.redirect("/faq?ask=missing-email#ask");
  }

  const inserted = await pool.query(
    "INSERT INTO faqs (question, email, created_at) VALUES ($1, $2, NOW()) RETURNING id",
    [question, email]
  );

  try {
    const { subject, html } = emailTemplates.adminNewFaq(question, email, inserted.rows[0].id);
    await sendEmail(ADMIN_EMAIL, subject, html);
  } catch (err) {
    console.error("Failed to send FAQ notification email:", err.message);
  }

  res.redirect("/faq?ask=sent");
});

// Testimony page; /testimony/:id opens one testimony (shareable link)
async function showTestimonyPage(req, res) {
  const infoResult = await pool.query(
    "SELECT * FROM ministry_info ORDER BY id DESC LIMIT 1"
  );
  const testimonyResult = await pool.query(
    "SELECT * FROM testimonies WHERE is_published = true ORDER BY id"
  );
  const testimonies = testimonyResult.rows;

  let focusTestimony = null;
  if (req.params.id) {
    focusTestimony = testimonies.find((t) => String(t.id) === req.params.id);
    if (!focusTestimony) return res.redirect("/testimony");
  }

  if (focusTestimony) {
    res.setMeta({
      title: "A testimony from our church family",
      description: focusTestimony.message,
    });
  } else {
    res.setMeta({
      title: "Testimonies",
      description:
        "Stories of God's faithfulness from our church family. Read their testimonies and share your own.",
    });
  }

  res.render("testimony", {
    info: infoResult.rows[0] || {},
    testimonies,
    title: "Submit Testimony",
    focusId: focusTestimony ? focusTestimony.id : null,
  });
}

router.get("/testimony", showTestimonyPage);
router.get("/testimony/:id", showTestimonyPage);

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

  try {
    const { subject, html } = emailTemplates.adminNewTestimony(name, email, message);
    await sendEmail(ADMIN_EMAIL, subject, html);
  } catch (err) {
    console.error("Failed to send testimony alert:", err.message);
  }

  res.redirect("/testimony?success=true");
});

// Published testimonies are listed on the testimony page
router.get("/testimonies", (req, res) => {
  res.redirect("/testimony");
});

// routes/publicRoutes.js
const aboutController = require("../controllers/aboutController");
router.get("/about", aboutController.showAbout);

module.exports = router;
