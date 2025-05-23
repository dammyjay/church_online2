const express = require('express');
const router = express.Router();
const pool = require('../models/db');


// router.get('/videos', videoController.showVideos);

router.get('/', async (req, res) => {
  try {
    const [infoResult, articlesResult, videosResult] = await Promise.all([
      pool.query('SELECT * FROM ministry_info ORDER BY id DESC LIMIT 1'),
      pool.query('SELECT * FROM articles ORDER BY created_at3 DESC LIMIT 3'),
      pool.query('SELECT * FROM videos4 ORDER BY created_at3 DESC LIMIT 3'),
    ]);
    const faqsResult = await pool.query('SELECT * FROM faqs WHERE is_published = true ORDER BY created_at DESC LIMIT 5');
    const info = infoResult.rows[0];
    const articles = articlesResult.rows;
    const faqs = faqsResult.rows;

    console.log('Raw video URLs:', videosResult.rows.map(v => v.youtube_url));
    const videos = videosResult.rows.map(video => {
        let embedUrl = video.youtube_url;
      
        if (!embedUrl.includes('youtube.com/embed/')) {
          // Full YouTube URL
          const match = embedUrl.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/);
          if (match) {
            embedUrl = `https://www.youtube.com/embed/${match[1]}`;
          } else {
            // Shortened youtu.be URL
            // const shortMatch = embedUrl.match(/(?:https?:\/\/)?youtu\.be\/([^&]+)/);
            const shortMatch = embedUrl.match(/(?:https?:\/\/)?youtu\.be\/([\w-]{11})/);
            if (shortMatch) {
              embedUrl = `https://www.youtube.com/embed/${shortMatch[1]}`;
            } else {
              // If just a video ID without domain
              if (/^[\w-]{11}$/.test(embedUrl)) {
                embedUrl = `https://www.youtube.com/embed/${embedUrl}`;
              } else {
                // fallback to empty or invalid URL if no match
                embedUrl = '';
              }
            }
          }
        }
      
        return {
          ...video,
          embed_url: embedUrl,
        };
      });
      console.log(videos.map(v => ({ title: v.title, embed_url: v.embed_url })));

    res.render('home', { info, articles, videos, faqs,  subscribed: req.query.subscribed });
  } catch (err) {
    console.error('Error fetching homepage data:', err);
    res.status(500).send('Server Error');
  }
});

router.get('/home2', async (req, res) => {
  try {
    const [infoResult, articlesResult, videosResult] = await Promise.all([
      pool.query('SELECT * FROM ministry_info ORDER BY id DESC LIMIT 1'),
      pool.query('SELECT * FROM articles ORDER BY created_at3 DESC LIMIT 3'),
      pool.query('SELECT * FROM videos4 ORDER BY created_at3 DESC LIMIT 3'),
    ]);

    const info = infoResult.rows[0];
    const articles = articlesResult.rows;

    console.log('Raw video URLs:', videosResult.rows.map(v => v.youtube_url));
    const videos = videosResult.rows.map(video => {
        let embedUrl = video.youtube_url;
      
        if (!embedUrl.includes('youtube.com/embed/')) {
          // Full YouTube URL
          const match = embedUrl.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/);
          if (match) {
            embedUrl = `https://www.youtube.com/embed/${match[1]}`;
          } else {
            // Shortened youtu.be URL
            // const shortMatch = embedUrl.match(/(?:https?:\/\/)?youtu\.be\/([^&]+)/);
            const shortMatch = embedUrl.match(/(?:https?:\/\/)?youtu\.be\/([\w-]{11})/);
            if (shortMatch) {
              embedUrl = `https://www.youtube.com/embed/${shortMatch[1]}`;
            } else {
              // If just a video ID without domain
              if (/^[\w-]{11}$/.test(embedUrl)) {
                embedUrl = `https://www.youtube.com/embed/${embedUrl}`;
              } else {
                // fallback to empty or invalid URL if no match
                embedUrl = '';
              }
            }
          }
        }
      
        return {
          ...video,
          embed_url: embedUrl,
        };
      });
      console.log(videos.map(v => ({ title: v.title, embed_url: v.embed_url })));

    res.render('home', { info, articles, videos });
  } catch (err) {
    console.error('Error fetching homepage data:', err);
    res.status(500).send('Server Error');
  }
});

// router.get('/articles', async (req, res) => {
//   const result = await pool.query('SELECT * FROM articles ORDER BY created_at3 DESC');
//   res.render('allArticles', { articles: result.rows });
// });

router.get('/articles', async (req, res) => {
  try {
    const search = req.query.search || '';
    let result;
    if (search) {
      result = await pool.query(
        'SELECT * FROM articles WHERE LOWER(title) LIKE $1 ORDER BY created_at3 DESC',
        [`%${search.toLowerCase()}%`]
      );
    } else {
      result = await pool.query('SELECT * FROM articles ORDER BY created_at3 DESC');
    }
    
    res.render('allArticles', {
      articles: result.rows,
      search, // ⬅️ pass search value to EJS
      subscribed: req.query.subscribed
    });
  } catch (err) {
    console.error('Error fetching public articles:', err);
    res.status(500).send('Server Error');
    }
    });    

// router.get('/videos', async (req, res) => {
//   const result = await pool.query('SELECT * FROM videos4 ORDER BY created_at3 DESC');
  
//   res.render('allVideos', { videos: result.rows });
// });


router.get('/videos', async (req, res) => {
  try {
    const search = req.query.search || '';
    let result;
    if (search) {
      result = await pool.query(
        'SELECT * FROM videos4 WHERE LOWER(title) LIKE $1 ORDER BY created_at3 DESC',
        [`%${search.toLowerCase()}%`]
      );
    } else {
      result = await pool.query('SELECT * FROM videos4 ORDER BY created_at3 DESC');
    }
    
    res.render('allVideos', {
      videos: result.rows,
      search, // ⬅️ pass search value to EJS
      subscribed: req.query.subscribed
    });
  } catch (err) {
    console.error('Error fetching public video  s:', err);
    res.status(500).send('Server Error');
    }
    });   

router.get('/signup', async (req, res) => {
  // const result = await pool.query('SELECT * FROM videos4 ORDER BY created_at3 DESC'); 
  
  res.render('signup', { error: null });
});

router.post('/faq/ask', async (req, res) => {
  const { question, email } = req.body;
  
  if (!question || question.trim() === '') {
  return res.redirect('/faq');
  }
  
  await pool.query('INSERT INTO faqs (question, email) VALUES ($1, $2)', [question, email || null]);
  res.redirect('/faq');
  });

module.exports = router;
