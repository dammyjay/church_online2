const pool = require("../models/db");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
// const nodemailer = require("nodemailer");
const sendEmail = require("../utils/sendEmail");
const cloudinary = require("../utils/cloudinary");
const fs = require("fs");

// Show forgot password form
exports.showForgotPasswordForm = (req, res) => {
  res.render("admin/forgotPassword", { message: null });
};

// Handle forgot password form submission
exports.handleForgotPassword = async (req, res) => {
  const { email } = req.body;
  const result = await pool.query("SELECT * FROM users2 WHERE email = $1", [
    email,
  ]);
  if (result.rows.length === 0) {
    // Show a clear message if email does not exist
    return res.render("admin/forgotPassword", {
      message: "Email does not exist.",
    });
  }
  const user = result.rows[0];
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 3600000); // 1 hour

  await pool.query(
    "UPDATE users2 SET reset_token = $1, reset_token_expires = $2 WHERE id = $3",
    [token, expires, user.id]
  );

  const resetUrl = `http://${req.headers.host}/admin/reset-password/${token}`;
  await sendEmail(
    email,
    "Password Reset",
    `Click <a href="${resetUrl}">here</a> to reset your password.`
  );

  res.render("admin/forgotPassword", {
    message: "a reset link has been sent.",
  });
};

// Show reset password form
exports.showResetPasswordForm = async (req, res) => {
  const { token } = req.params;
  const result = await pool.query(
    "SELECT * FROM users2 WHERE reset_token = $1 AND reset_token_expires > NOW()",
    [token]
  );
  if (result.rows.length === 0) {
    return res.send("Invalid or expired token.");
  }
  res.render("admin/resetPassword", { token, message: null });
};

// Handle reset password submission
exports.handleResetPassword = async (req, res) => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;
  if (password !== confirmPassword) {
    return res.render("admin/resetPassword", {
      token,
      message: "Passwords do not match.",
    });
  }
  const result = await pool.query(
    "SELECT * FROM users2 WHERE reset_token = $1 AND reset_token_expires > NOW()",
    [token]
  );
  if (result.rows.length === 0) {
    return res.send("Invalid or expired token.");
  }
  // const hashed = await bcrypt.hash(password, 10);
  await pool.query(
    "UPDATE users2 SET password = $1, reset_token = NULL, reset_token_expires = NULL WHERE reset_token = $2",
    [password, token]
  );
  res.render("admin/login", {
    error: null,
    title: "Login",
    redirect: "",
    message: "Password reset successful. Please log in.",
  });
};

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

exports.logout = (req, res) => {
  req.session.destroy();
  res.redirect("/admin/login");
};


exports.dashboard = async (req, res) => {
  // if (!req.session.admin) return res.redirect('/admin/login');
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.redirect("/admin/login");
  }

  try {
    // Query filters
    const { gender, role, email } = req.query;
    // Step 1: Get Ministry Info
    const infoResult = await pool.query(
      "SELECT * FROM ministry_info ORDER BY id DESC LIMIT 1"
    );
    const info = infoResult.rows[0];

    // Step 2: Build dynamic user query
    let query = "SELECT * FROM users2 WHERE 1=1";
    const params = [];

    if (gender) {
      params.push(gender);
      query += ` AND gender = $${params.length}`;
    }

    if (role) {
      params.push(role);
      query += ` AND role = $${params.length}`;
    }

    if (email) {
      params.push(`%${email.toLowerCase()}%`);
      query += ` AND LOWER(email) LIKE $${params.length}`;
    }

    query += " ORDER BY created_at DESC";
    const usersResult = await pool.query(query, params);
    const users = usersResult.rows;

    // Step 3: Stats
    const totalResult = await pool.query("SELECT COUNT(*) FROM users2");
    const totalUsers = parseInt(totalResult.rows[0].count);

    const lastWeekResult = await pool.query(
      "SELECT COUNT(*) FROM users2 WHERE created_at >= NOW() - INTERVAL '7 days'"
    );
    const recentUsers = parseInt(lastWeekResult.rows[0].count);

    const percentageNew =
      totalUsers > 0 ? Math.round((recentUsers / totalUsers) * 100) : 0;

    const pendingFaqResult = await pool.query(
      "SELECT COUNT(*) FROM faqs WHERE answer IS NULL OR TRIM(answer) = ''"
    );
    const pendingFaqCount = parseInt(pendingFaqResult.rows[0].count);

    const profilePic = req.session.user
      ? req.session.user.profile_picture
      : null;

    res.render("admin/dashboard", {
      info,
      users,
      profilePic,
      pendingFaqCount,
      totalUsers,
      recentUsers,
      percentageNew,
      gender,
      role,
      email,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};

exports.editUserForm = async (req, res) => {
  const userId = req.params.id;

  try {
    const result = await pool.query("SELECT * FROM users2 WHERE id = $1", [
      userId,
    ]);
    const user = result.rows[0];
    if (!user) {
      return res.status(404).send("User not found");
    }

    res.render("admin/editUser", { user });
  } catch (error) {
    console.error("Error loading user edit form:", error);
    res.status(500).send("Server error");
  }
};

exports.updateUser = async (req, res) => {
  const userId = req.params.id;
  const { fullname, email, phone, gender, role } = req.body;

  try {
    await pool.query(
      "UPDATE users2 SET fullname = $1, email = $2, phone = $3, gender = $4, role = $5 WHERE id = $6",
      [fullname, email, phone, gender, role, userId]
    );

    res.redirect("/admin/dashboard");
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).send("Server error");
  }
};

exports.deleteUser = async (req, res) => {
  const userId = req.params.id;

  try {
    await pool.query("DELETE FROM users2 WHERE id = $1", [userId]);
    res.redirect("/admin/dashboard");
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).send("Server error");
  }
};

// Show announcements page
exports.showAnnouncements = async (req, res) => {
  const infoResult = await pool.query(
    "SELECT * FROM ministry_info ORDER BY id DESC LIMIT 1"
  );
  const info = infoResult.rows[0] || {};
  const result = await pool.query(
    "SELECT * FROM announcements ORDER BY event_date DESC"
    // "SELECT * FROM announcements WHERE is_visible = true ORDER BY event_date DESC LIMIT 1"
  );
  res.render("admin/announcements", { info, announcements: result.rows });
};

// Create a new announcement
exports.createAnnouncement = async (req, res) => {
  const infoResult = await pool.query(
    "SELECT * FROM ministry_info ORDER BY id DESC LIMIT 1"
  );
  const info = infoResult.rows[0];
  const { title, message, event_date } = req.body;
  const is_visible = req.body.is_visible === "on";
  let flyer_url = req.file ? req.file.path : null; // Use existing URL if provided

  await pool.query(
    "INSERT INTO announcements (title, message, event_date, flyer_url, is_visible) VALUES ($1, $2, $3, $4, $5)",
    [title, message, event_date, flyer_url, is_visible]
  );
  res.redirect("/admin/announcements");
};

// Show the edit form for an announcement
exports.showEditAnnouncement = async (req, res) => {
  const { id } = req.params;
  const infoResult = await pool.query(
    "SELECT * FROM ministry_info ORDER BY id DESC LIMIT 1"
  );
  const info = infoResult.rows[0] || {};
  
  const annResult = await pool.query(
    "SELECT * FROM announcements WHERE id = $1",
    [id]
  );
  const announcement = annResult.rows[0];
  if (!announcement) return res.redirect("/admin/announcements");
  res.render("admin/editAnnouncement", { info, announcement });
};

// Handle the edit form submission
exports.editAnnouncement = async (req, res) => {
  const { id } = req.params;
  const { title, message, event_date } = req.body;
  const is_visible = req.body.is_visible === "on";
  let flyer_url = req.body.existing_flyer_url || null;

  // If a new flyer is uploaded, upload to cloudinary and use new URL
  if (req.file) {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "announcements",
    });
    flyer_url = result.secure_url;
    // fs.unlinkSync(req.file.path);
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
  }

  await pool.query(
    "UPDATE announcements SET title = $1, message = $2, event_date = $3, flyer_url = $4, is_visible = $5 WHERE id = $6",
    [title, message, event_date, flyer_url, is_visible, id]
  );
  res.redirect("/admin/announcements");
};

// In adminController.js
exports.deleteAnnouncement = async (req, res) => {
  await pool.query("DELETE FROM announcements WHERE id = $1", [req.params.id]);
  res.redirect("/admin/announcements");
};

// Show the newsletter form
exports.showNewsletterForm = async (req, res) => {
  const infoResult = await pool.query(
    "SELECT * FROM ministry_info ORDER BY id DESC LIMIT 1"
  );
  const info = infoResult.rows[0] || {};
  res.render("admin/newsletter", { info });
};

// Send the newsletter to all users
exports.sendNewsletter = async (req, res) => {
  const { subject, message } = req.body;
  let imageUrl = null;

  // Upload image to Cloudinary if provided
  if (req.file) {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "newsletters",
    });
    imageUrl = result.secure_url;
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path); // Remove temp file
    }
  }
  const infoResult = await pool.query(
    "SELECT * FROM ministry_info ORDER BY id DESC LIMIT 1"
  );
  const info = infoResult.rows[0] || {};
  // Get all user emails
  const resultUsers = await pool.query(
    "SELECT email FROM users2 WHERE email IS NOT NULL"
  );
  const emails = resultUsers.rows.map((row) => row.email);

  // Compose HTML message
  let htmlMsg = `<div>${message}</div>`;
  if (imageUrl) {
    htmlMsg += `<div style="margin-top:20px;"><img src="${imageUrl}" alt="Newsletter Image" style="max-width:100%;border-radius:8px;"></div>`;
  }

  // Send to all users
  for (const email of emails) {
    await sendEmail(email, subject, htmlMsg);
  }

  res.render("admin/newsletter", {
    info,
    success: "Newsletter sent to all members!",
  });
};

exports.getAdminProfile = async (req, res) => {
  const userId = req.session.user?.id;
  if (!userId || req.session.user.role !== "admin")
    return res.redirect("/admin/login");
  const result = await pool.query("SELECT * FROM users2 WHERE id = $1", [
    userId,
  ]);
  res.render("adminProfile", {
    user: result.rows[0],
    title: "Admin Profile",
  });
};

exports.updateAdminProfile = async (req, res) => {
  const { fullname, phone } = req.body;
  const profile_picture = req.file
    ? req.file.path
    : req.session.user.profile_picture;
  await pool.query(
    "UPDATE users2 SET fullname = $1, phone = $2, profile_picture = $3 WHERE id = $4",
    [fullname, phone, profile_picture, req.session.user.id]
  );
  req.session.user.profile_picture = profile_picture; // update session
  res.redirect("/admin/profile");
};
