// app.js
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const createTables = require("./models/initTables");
const notificationRoutes = require("./routes/notificationRoutes");
const runNewsletterScheduler = require("./cron/newsletterScheduler");
const runDevotionalScheduler = require("./cron/cronJobs");

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
    secure: false, // Change to true only in HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 1 day
    }
}));

app.locals.vapidPublicKey = process.env.VAPID_PUBLIC_KEY;

// app.use((req, res, next) => {
//   if (
//     process.env.NODE_ENV === "production" &&
//     req.headers["x-forwarded-proto"] !== "https"
//   ) {
//     return res.redirect("https://" + req.headers.host + req.url);
//   }
//   next();
// });

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

const adminFaqRoutes = require('./routes/adminFaqRoutes');
app.use('/', adminFaqRoutes);

const adminTestimonyRoutes = require("./routes/adminTestimonyRoutes");
app.use("/", adminTestimonyRoutes);

const publicVideoRoutes = require('./routes/publicVideoRoutes');
app.use('/', publicVideoRoutes);

const interactionRoutes = require('./routes/interactionRoutes');
app.use('/interaction', interactionRoutes);

// // Example in your routes file
// router.get('/login', (req, res) => {
//   res.render('admin/login'); // note: include 'admin/' because login.ejs is inside admin folder
// });



// The homepage route lives in routes/publicRoutes.js

app.use("/notifications", notificationRoutes);
  

runNewsletterScheduler();

runDevotionalScheduler();


// Run table creation at startup
createTables();


// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on https://localhost:${PORT}`);
});
