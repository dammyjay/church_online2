// app.js
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const layout = require('express-ejs-layouts');

// Set EJS as view engine
app.set('view engine', 'ejs');

app.set('views', path.join(__dirname, 'views'));
app.use(layout);

// Set default layout file (optional)
// app.set('layout', 'partials/adminLayout'); // default layout for all .ejs files unless overridden


// Middleware
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.set('view engine', 'ejs');
app.set('view cache', false);
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: true, // Change to true only in HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 1 day
    }
}));

app.use((req, res, next) => {
  console.log('🧾 SESSION:', req.session);
  next();
  });

  app.use((req, res, next) => {
    res.locals.title = 'Ministry'; // Default title
    next();
  });
    
// Routes
// app.get('/', (req, res) => {
//   res.render('home');
// });

const publicRoutes = require('./routes/publicRoutes');
app.use('/', publicRoutes);


const adminRoutes = require('./routes/adminRoutes');
app.use('/admin', adminRoutes);

const videoRoutes = require('./routes/videoRoutes');
app.use('/admin', videoRoutes);

const userRoutes = require('./routes/userRoutes');
app.use('/', userRoutes);

const subscribeRoutes = require('./routes/subscribeRoutes');
app.use('/', subscribeRoutes);

const publicFaqRoutes = require('./routes/publicFaqRoutes.js');
app.use('/', publicFaqRoutes);

const adminFaqRoutes = require('./routes/adminFaqRoutes');
app.use('/', adminFaqRoutes);

const publicArticleRoutes = require('./routes/publicArticleRoutes');
app.use('/', publicArticleRoutes);

const publicVideoRoutes = require('./routes/publicVideoRoutes');
app.use('/', publicVideoRoutes);

// // Example in your routes file
// router.get('/login', (req, res) => {
//   res.render('admin/login'); // note: include 'admin/' because login.ejs is inside admin folder
// });


// Homepage Route
app.get('/', async (req, res) => {
    try {
      const [infoResult, articlesResult, videosResult] = await Promise.all([
        pool.query("SELECT * FROM ministry_info ORDER BY id DESC LIMIT 1"),
        pool.query("SELECT * FROM articles ORDER BY created_at3 DESC LIMIT 3"),
        pool.query("SELECT * FROM videos4 ORDER BY created_at3 DESC LIMIT 3"),
      ]);

      const info = infoResult.rows[0];
      const articles = articlesResult.rows;
      const videos = videosResult.rows;

      // Add this line to pass login status to EJS
      const isLoggedIn = !!req.session.user; // or whatever property you use for login
      const profilePic = req.session.user ? req.session.user.profile_pic : null;
      console.log("User session:", req.session.user);
      console.log("Is user logged in:", isLoggedIn);
      res.render("home", { info, articles, videos, isLoggedIn, profilePic});
    } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
    }
});
  

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
