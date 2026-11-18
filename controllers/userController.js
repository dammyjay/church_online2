const bcrypt = require("bcrypt");
const pool = require("../models/db");
const { sendEmail } = require("../utils/sendEmail");

exports.showSignup = (req, res) => {
  // res.sendFile(path.join(__dirname, 'signup.html'));
  res.render("signup", { error: null });
};

exports.showLogin = (req, res) => {
  res.render("admin/login", { error: null });
};

exports.signup = async (req, res) => {
  const { email, username, phone, gender, password, dob} = req.body;
  const file = req.file;
  const exists = await pool.query("SELECT * FROM users2 WHERE email = $1", [
    email,
  ]);
  if (exists.rows.length > 0) {
    return res.status(400).send("Email already registered.");
  }

  // Delete previous pending record
  await pool.query("DELETE FROM pending_users WHERE email = $1", [email]);

  //this code below that will store the file in the cloudinary to the database
  // const profile_picture = req.file ? req.file.path : null;
  const defaultImage = "/profile.webp"; // or any image path in your public folder
  const profile_picture = req.file ? req.file.path : defaultImage;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const role = "user"; // Default role for new users
  const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
  const hashed = await bcrypt.hash(password, 10);
  const created_at = new Date(); // Create timestamp in JS
  console.log("📷 Filename to save in DB:", profile_picture);

  await pool.query(
    "INSERT INTO pending_users (fullname, email, phone, gender, password, otp_code, otp_expires, profile_picture,role,created_at, dob) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",
    // 'INSERT INTO pending_users (username, email, phone)
    [
      username,
      email,
      phone,
      gender,
      hashed,
      otp,
      expires,
      profile_picture,
      role,
      created_at,
      dob,
    ]
  );
  try {
    await sendEmail(email, "Your OTP Code", `Your code is: ${otp}`);
  } catch (err) {
    console.error("Failed to send OTP email:", err.message);
    // Without the code the user can't finish signing up, so don't keep the pending record
    await pool.query("DELETE FROM pending_users WHERE email = $1", [email]);
    return res
      .status(500)
      .send("We couldn't send the verification email right now. Please try again later.");
  }
  res.status(200).send("OTP sent to your email.");
};

exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  const created_at = new Date(); // Create timestamp in JS
  const result = await pool.query(
    "SELECT * FROM pending_users WHERE email = $1 AND otp_code = $2",
    [email, otp]
  );

  if (result.rows.length === 0) return res.status(400).send("Invalid OTP");

  const user = result.rows[0];
  if (new Date(user.otp_expires) < new Date())
    return res.status(400).send("OTP expired");

  await pool.query(
    "INSERT INTO users2 (fullname, email, phone, gender, password, profile_picture, role,created_at, dob) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)",
    [
      user.fullname,
      user.email,
      user.phone,
      user.gender,
      user.password,
      user.profile_picture,
      "user",
      created_at,
      user.dob,
    ]
  );

  await pool.query("DELETE FROM pending_users WHERE email = $1", [email]);
  res.status(200).send("Verification success");
};

exports.getUserProfile = async (req, res) => {
  const user = req.session.user;
  if (!user) return res.redirect("/admin/login");

  const result = await pool.query("SELECT * FROM users2 WHERE id = $1", [
    user.id,
  ]);

  if (result.rows.length === 0) return res.status(404).send("User not found");

  const currentUser = result.rows[0];
  const isAdmin = user.role === "admin";

  return res.render("userProfile", {
    user: currentUser,
    title: isAdmin ? "Admin Profile" : "My Profile",
    backUrl: isAdmin ? "/admin/dashboard" : "/home2",
    updated: req.query.updated === "1",
  });
};

exports.updateUserProfile = async (req, res) => {
  const user = req.session.user;
  if (!user) return res.redirect("/admin/login");

  const { fullname, phone, dob } = req.body;
  const newPicture = req.file ? req.file.path : null;

  // Keep the existing photo unless a new one was uploaded
  const result = await pool.query(
    "UPDATE users2 SET fullname = $1, phone = $2, profile_picture = COALESCE($3, profile_picture), dob = $4 WHERE id = $5 RETURNING profile_picture",
    [fullname, phone, newPicture, dob || null, user.id]
  );
  // Update the session so the header shows the new picture
  req.session.user.profile_pic = result.rows[0]?.profile_picture || user.profile_pic;

  return res.redirect("/profile?updated=1");
};