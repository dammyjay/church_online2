const pool = require('../models/db');

// exports.showArticles = async (req, res) => {
//   const result = await pool.query('SELECT * FROM articles ORDER BY created_at3 DESC');
//   res.render('admin/articles', { articles: result.rows });
// };

exports.showSearchArticles = async (req, res) => {
  try {
    const search = req.query.search;
    const infoResult = await pool.query(
      'SELECT * FROM ministry_info ORDER BY id DESC LIMIT 1',
    );
    const info = infoResult.rows[0] || {};
    let articlesResult;

    if (search) {
      articlesResult = await pool.query(
        'SELECT * FROM articles WHERE LOWER(title) LIKE $1 ORDER BY created_at DESC',
        [`%${search.toLowerCase()}%`]
      );
    } else {
      articlesResult = await pool.query('SELECT * FROM articles ORDER BY created_at DESC');
    }

    res.render('admin/articles', {
      info,
      title: 'All Articles',
      articles: articlesResult.rows,
      search, // Pass back to template for input field value
    });

  } catch (err) {
    console.error('Error searching articles:', err);
    res.status(500).send('Server Error');
  }
};

exports.saveArticle = async (req, res) => {
  const { title, content } = req.body;
  const image_url = req.file ? req.file.path : null;
  const created_at3 = new Date(); // Create timestamp in JS

  await pool.query(
    // 'INSERT INTO articles (title, content, image_url) VALUES ($1, $2, $3)',
    // [title, content, image_url]
    'INSERT INTO articles (title, content, image_url, created_at3) VALUES ($1, $2, $3, $4)',
    [title, content, image_url, created_at3]
  );

  res.redirect('/admin/articles');
};

exports.showEditForm = async (req, res) => {
    const id = req.params.id;
    const result = await pool.query('SELECT * FROM articles WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).send('Article not found');
    }
    res.render('admin/editArticle', { article: result.rows[0], title: 'Edit article'  });
  };
  
  exports.updateArticle = async (req, res) => {
    const id = req.params.id;
    const { title, content } = req.body;
    const image_url = req.file ? req.file.path : null;
  
    if (image_url) {
      // Update all fields including image_url
      await pool.query(
        'UPDATE articles SET title = $1, content = $2, image_url = $3 WHERE id = $4',
        [title, content, image_url, id]
      );
    } else {
      // Update title and content only
      await pool.query(
        'UPDATE articles SET title = $1, content = $2 WHERE id = $3',
        [title, content, id]
      );
    }
  
    res.redirect('/admin/articles');
  };
  
  exports.deleteArticle = async (req, res) => {
    const id = req.params.id;
    await pool.query('DELETE FROM articles WHERE id = $1', [id]);
    res.redirect('/admin/articles');
  };
  

  exports.showArticles = async (req, res) => {
    try {
      const infoResult = await pool.query('SELECT * FROM ministry_info ORDER BY id DESC LIMIT 1');
      const info = infoResult.rows[0] || {};
      
      const articlesResult = await pool.query('SELECT * FROM articles ORDER BY created_at3 DESC');
      const articles = articlesResult.rows;
  
      res.render('admin/articles', { info, articles, title: 'Article'  });
    } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
    }
  };
  
  // exports.showSingleArticle = async (req, res) => {
  //   const id = req.params.id;
  //   const result = await pool.query('SELECT * FROM articles WHERE id = $1', [id]);
  //   if (result.rows.length === 0) return res.status(404).send('Article not found');
  //   res.render('article', {
  //   article: result.rows[0],
  //   title: result.rows[0].title
  //   });
  // };
    
  exports.showSingleArticle = async (req, res) => {
    const articleId = req.params.id;
    // Fetch the main article
    const result = await pool.query("SELECT * FROM articles WHERE id = $1", [
      articleId,
    ]);
    if (result.rows.length === 0)
      return res.status(404).send("Article not found");
    const article = result.rows[0];

    // Fetch related articles by similar title words (excluding the current article)
    const keywords = article.title.split(" ").slice(0, 3); // Use first 3 words as keywords
    const relatedResult = await pool.query(
      `SELECT * FROM articles 
       WHERE id != $1 AND (
         title ILIKE $2 OR title ILIKE $3 OR title ILIKE $4
       )
       LIMIT 4`,
      [
        articleId,
        `%${keywords[0]}%`,
        `%${keywords[1] || ""}%`,
        `%${keywords[2] || ""}%`,
      ]
    );
    const relatedArticles = relatedResult.rows;
    const relatedIds = relatedArticles
      .map((a) => a.id)
      .concat([parseInt(articleId)]);
    const otherResult = await pool.query(
      `SELECT * FROM articles WHERE id NOT IN (${relatedIds
        .map((_, i) => `$${i + 1}`)
        .join(",")}) ORDER BY created_at3 DESC LIMIT 4`,
      relatedIds
    );
    const otherArticles = otherResult.rows;
  

    res.render("singleArticle", { article, relatedArticles, otherArticles, isLoggedIn: !!req.session.user  });
  };

