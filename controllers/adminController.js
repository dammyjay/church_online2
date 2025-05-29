const pool = require('../models/db');
const bcrypt = require('bcrypt');

const crypto = require("crypto");
// const nodemailer = require("nodemailer");
const sendEmail = require("../utils/sendEmail");


// Show forgot password form
exports.showForgotPasswordForm = (req, res) => {
  res.render('admin/forgotPassword', { message: null });
};

// Handle forgot password form submission
exports.handleForgotPassword = async (req, res) => {
  const { email } = req.body;
  const result = await pool.query('SELECT * FROM users2 WHERE email = $1', [email]);
  if (result.rows.length === 0) {
    return res.render('admin/forgotPassword', { message: 'If this email exists, a reset link has been sent.' });
  }
  const user = result.rows[0];
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 3600000); // 1 hour

  await pool.query(
    'UPDATE users2 SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
    [token, expires, user.id]
  );

  const resetUrl = `http://${req.headers.host}/admin/reset-password/${token}`;
  await sendEmail(
    email,
    'Password Reset',
    `Click <a href="${resetUrl}">here</a> to reset your password.`
  );

  res.render('admin/forgotPassword', { message: 'If this email exists, a reset link has been sent.' });
};


// Handle forgot password form submission
// exports.handleForgotPassword = async (req, res) => {
//   const { email } = req.body;
//   const result = await pool.query('SELECT * FROM users2 WHERE email = $1', [email]);
//   if (result.rows.length === 0) {
//     return res.render('admin/forgotPassword', { message: 'If this email exists, a reset link has been sent.' });
//   }
//   const user = result.rows[0];
//   const token = crypto.randomBytes(32).toString('hex');
//   const expires = new Date(Date.now() + 3600000); // 1 hour

//   await pool.query(
//     'UPDATE users2 SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
//     [token, expires, user.id]
//   );

//   // Configure your SMTP settings
//   const transporter = nodemailer.createTransport({
//     // Example for Gmail:
//     // service: 'gmail',
//     // auth: { user: 'your@gmail.com', pass: 'yourpassword' }
//     // Use your real SMTP config in production!
//   });

//   const resetUrl = `http://${req.headers.host}/admin/reset-password/${token}`;
//   await transporter.sendMail({
//     to: user.email,
//     subject: 'Password Reset',
//     html: `Click <a href="${resetUrl}">here</a> to reset your password.`
//   });

//   res.render('admin/forgotPassword', { message: 'If this email exists, a reset link has been sent.' });
// };

// Show reset password form
exports.showResetPasswordForm = async (req, res) => {
  const { token } = req.params;
  const result = await pool.query(
    'SELECT * FROM users2 WHERE reset_token = $1 AND reset_token_expires > NOW()',
    [token]
  );
  if (result.rows.length === 0) {
    return res.send('Invalid or expired token.');
  }
  res.render('admin/resetPassword', { token, message: null });
};

// Handle reset password submission
exports.handleResetPassword = async (req, res) => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;
  if (password !== confirmPassword) {
    return res.render('admin/resetPassword', { token, message: 'Passwords do not match.' });
  }
  const result = await pool.query(
    'SELECT * FROM users2 WHERE reset_token = $1 AND reset_token_expires > NOW()',
    [token]
  );
  if (result.rows.length === 0) {
    return res.send('Invalid or expired token.');
  }
  // const hashed = await bcrypt.hash(password, 10);
  await pool.query(
    'UPDATE users2 SET password = $1, reset_token = NULL, reset_token_expires = NULL WHERE reset_token = $2',
    [password, token]
  );
  res.render('admin/login', { error: null, title: 'Login', redirect: '', message: 'Password reset successful. Please log in.' });
};


// exports.showLogin = (req, res) => {
//   res.render('admin/login', { error: null, title: 'Login'  });
// };

exports.showLogin = (req, res) => {
  res.render("admin/login", {
    error: null,
    title: "Login",
    redirect: req.query.redirect || "",
  });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const redirectUrl = req.query.redirect;
  const result = await pool.query(
    "SELECT * FROM users2 WHERE email = $1 AND password = $2",
    [email, password]
  );

  // if (result.rows.length === 0) {
  //   return res.render("admin/login", { error: "Invalid credentials" });
  // }

  if (result.rows.length === 0) {
    return res.render("admin/login", {
      error: "Invalid credentials",
      title: "Login",
      redirect: redirectUrl || "", // Always pass redirect!
    });
  }

  const user = result.rows[0];

  // Save session
  req.session.user = {
    id: user.id,
    email: user.email,
    role: user.role,
    profile_pic: user.profile_picture, 
  };

  // Redirect to intended page if present, else default
  if (redirectUrl) {
    return res.redirect(redirectUrl);
  }

  // Redirect based on role
  if (user.role === "admin") {
    console.log("Admin login successful");
    return res.redirect("/admin/dashboard");
  } else {
    console.log("User login successful");
    return res.redirect("/home2");
  }
};

// exports.login = async (req, res) => {
//   const { email, password } = req.body;
//   const result = await pool.query('SELECT * FROM users2 WHERE email = $1', [email]);
//   // Check if the user exists

//   if (result.rows.length === 0) {
//     return res.render('admin/login', { error: 'Invalid credentials' });
//   }
  
//   const user = result.rows[0];
//   const isMatch = await bcrypt.compare(password, user.password);
//   if (!isMatch) {
//     return res.render('admin/login', { error: 'Invalid credentials' });
//   }

//   req.session.user = {
//     id: user.id,
//     email: user.email,
//     role: user.role,
//   };
//   // Check if the user is an admin
//   if (user.role === 'admin') {
//     return res.redirect('/admin/dashboard');
//   } else {
//     return res.redirect('/');
//   }

// }


// exports.dashboard = (req, res) => {
//   // if (!req.session.admin) return res.redirect('/admin/login');
//   if (!req.session.user || req.session.user.role !== 'admin') return res.redirect('/admin/login');
//   // res.render('admin/dashboard');
// };

exports.logout = (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
};

// exports.dashboard = async (req, res) => {
//   // if (!req.session.admin) return res.redirect('/admin/login');
//   if (!req.session.user || req.session.user.role !== 'admin') {
//     return res.redirect('/admin/login');
//     }

//   try {
//     const infoResult = await pool.query('SELECT * FROM ministry_info ORDER BY id DESC LIMIT 1');
    
//     const info = infoResult.rows[0];

//     console.log('info:', info);
//     res.render('admin/dashboard', { info });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Server Error');
//   }
// };


exports.dashboard = async (req, res) => {
  // if (!req.session.admin) return res.redirect('/admin/login');
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.redirect('/admin/login');
    }

  try {
    const infoResult = await pool.query(
      "SELECT * FROM ministry_info ORDER BY id DESC LIMIT 1"
    );
    const usersResult = await pool.query(
      "SELECT * FROM users2 ORDER BY created_at DESC"
    );
    const users = usersResult.rows;

    const info = infoResult.rows[0];
    // Get profilePic from session
    const profilePic = req.session.user ? req.session.user.profile_picture : null;
    console.log("User session:", req.session.user);
    console.log("Profile picture:", profilePic);
    
    console.log("info:", info, "users:", users);
    res.render("admin/dashboard", { info, users, profilePic }); // ← Pass users to EJS
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
};

exports.editUserForm = async (req, res) => {
  const userId = req.params.id;

  try {
    const result = await pool.query('SELECT * FROM users2 WHERE id = $1', [userId]);
    const user = result.rows[0];
    if (!user) {
      return res.status(404).send('User not found');
    }

    res.render('admin/editUser', { user });
  } catch (error) {
    console.error('Error loading user edit form:', error);
    res.status(500).send('Server error');
  }
};

exports.updateUser = async (req, res) => {
  const userId = req.params.id;
  const { fullname, email, phone, gender, role } = req.body;

  try {
    await pool.query(
      'UPDATE users2 SET fullname = $1, email = $2, phone = $3, gender = $4, role = $5 WHERE id = $6',
      [fullname, email, phone, gender, role, userId]
    );

    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).send('Server error');
  }
};

exports.deleteUser = async (req, res) => {
  const userId = req.params.id;

  try {
    await pool.query('DELETE FROM users2 WHERE id = $1', [userId]);
    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).send('Server error');
  }
};


// Show announcements page
exports.showAnnouncements = async (req, res) => {
  const infoResult = await pool.query(
    "SELECT * FROM ministry_info ORDER BY id DESC LIMIT 1"
  );
  const info = infoResult.rows[0] || {};
  const result = await pool.query('SELECT * FROM announcements ORDER BY event_date DESC');
  res.render('admin/announcements', {info, announcements: result.rows });
};

// Create a new announcement
exports.createAnnouncement = async (req, res) => {
  const infoResult = await pool.query(
    "SELECT * FROM ministry_info ORDER BY id DESC LIMIT 1"
  );
  const info = infoResult.rows[0];
  const { title, message, event_date } = req.body;
  let flyer_url = req.file ? req.file.path : null; // Use existing URL if provided

  await pool.query(
    "INSERT INTO announcements (title, message, event_date, flyer_url) VALUES ($1, $2, $3, $4)",
    [title, message, event_date, flyer_url]
  );
  res.redirect("/admin/announcements");
};

// Show the edit form for an announcement
exports.showEditAnnouncement = async (req, res) => {
  const { id } = req.params;
  const infoResult = await pool.query("SELECT * FROM ministry_info ORDER BY id DESC LIMIT 1");
  const info = infoResult.rows[0] || {};
  const annResult = await pool.query("SELECT * FROM announcements WHERE id = $1", [id]);
  const announcement = annResult.rows[0];
  if (!announcement) return res.redirect('/admin/announcements');
  res.render('admin/editAnnouncement', { info, announcement });
};

// Handle the edit form submission
exports.editAnnouncement = async (req, res) => {
  const { id } = req.params;
  const { title, message, event_date } = req.body;
  let flyer_url = req.body.existing_flyer_url || null;

  // If a new flyer is uploaded, upload to cloudinary and use new URL
  if (req.file) {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "announcements",
    });
    flyer_url = result.secure_url;
    fs.unlinkSync(req.file.path);
  }

  await pool.query(
    "UPDATE announcements SET title = $1, message = $2, event_date = $3, flyer_url = $4 WHERE id = $5",
    [title, message, event_date, flyer_url, id]
  );
  res.redirect("/admin/announcements");
};

// In adminController.js
exports.deleteAnnouncement = async (req, res) => {
  await pool.query('DELETE FROM announcements WHERE id = $1', [req.params.id]);
  res.redirect('/admin/announcements');
};