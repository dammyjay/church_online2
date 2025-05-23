const bcrypt = require('bcrypt');
const pool = require('../models/db');
const sendEmail = require('../utils/sendEmail');

exports.showSignup = (req, res) => {
    // res.sendFile(path.join(__dirname, 'signup.html'));
    res.render('signup', { error: null });
};

exports.showLogin = (req, res) => {
    res.render('admin/login', { error: null });
  };

exports.signup = async (req, res) => {
    const { email, username, phone, gender, password } = req.body;
    const file = req.file;
    // const profile_picture = file ? '/uploads/' + file.filename : null;
    // console.log("📸 Uploaded File:", req.file); // <- log this
    // this code below that will store the file in the uploads folder to the database
    // const profile_picture = req.file ? req.file.filename : null;
    const exists = await pool.query('SELECT * FROM users2 WHERE email = $1', [email]);
    if (exists.rows.length > 0) {
      return res.status(400).send('Email already registered.');
    }

    // Delete previous pending record
    await pool.query('DELETE FROM pending_users WHERE email = $1', [email]);
    

    //this code below that will store the file in the cloudinary to the database
    const profile_picture = req.file ? req.file.path : null;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const role = "user"; // Default role for new users
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    // const hashed = await bcrypt.hash(password, 10);
    const created_at = new Date(); // Create timestamp in JS
    console.log("📷 Filename to save in DB:", profile_picture);
    
    // await pool.query(`
    //   INSERT INTO pending_users (email, username, phone, gender, password, otp, profile_picture, role)
    //   VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      
    // `, [email, username, phone, gender, password, otp, profile_picture, role]);

    await pool.query(
        'INSERT INTO pending_users (fullname, email, phone, gender, password, otp_code, otp_expires, profile_picture,role,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
      // 'INSERT INTO pending_users (username, email, phone)
        [username, email, phone, gender, password, otp, expires, profile_picture, role,created_at]
      );
  
    // await transporter.sendMail({
    //   to: email,
    //   subject: "Your OTP Code",
    //   text: `Your OTP is: ${otp}`,
    // });
  
    // res.sendStatus(200);

    await sendEmail(email, 'Your OTP Code', `Your code is: ${otp}`);
    res.status(200).send('OTP sent to your email.');

    
};
  

exports.verifyOtp = async (req, res) => {
    const { email, otp } = req.body;
    const created_at = new Date(); // Create timestamp in JS
    const result = await pool.query('SELECT * FROM pending_users WHERE email = $1 AND otp_code = $2', [email, otp]);
    
    if (result.rows.length === 0) return res.status(400).send('Invalid OTP');
    
    const user = result.rows[0];
    if (new Date(user.otp_expires) < new Date()) return res.status(400).send('OTP expired');
    
    await pool.query(
    'INSERT INTO users2 (fullname, email, phone, gender, password, profile_picture, role,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
    [user.fullname, user.email, user.phone, user.gender, user.password, user.profile_picture, 'user', created_at]
    );
    
    await pool.query('DELETE FROM pending_users WHERE email = $1', [email]);
    res.status(200).send('Verification success');
};