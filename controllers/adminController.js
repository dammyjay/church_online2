const pool = require('../models/db');
const bcrypt = require('bcrypt');


exports.showLogin = (req, res) => {
  res.render('admin/login', { error: null, title: 'Login'  });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const result = await pool.query('SELECT * FROM users2 WHERE email = $1 AND password = $2', [email, password]);

  // if (result.rows.length > 0) {
  //   // req.session.admin = true;
  //   // res.redirect('/admin/dashboard');

  //   const user = result.rows[0];  
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
    
  // } else {
  //   res.render('admin/login', { error: 'Invalid credentials' });
  // }
  
  if (result.rows.length === 0) {
    return res.render('admin/login', { error: 'Invalid credentials' });
  }
  
  const user = result.rows[0];
  
  // Save session
  req.session.user = {
    id: user.id,
    email: user.email,
    role: user.role,
  };
  
  // Redirect based on role
  if (user.role === 'admin') {
    console.log('Admin login successful');
    return res.redirect('/admin/dashboard');
  } else {
    console.log('User login successful');
    return res.redirect('/');
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
    const infoResult = await pool.query('SELECT * FROM ministry_info ORDER BY id DESC LIMIT 1');
    const usersResult = await pool.query('SELECT * FROM users2 ORDER BY created_at DESC');
    const users = usersResult.rows;

    const info = infoResult.rows[0];

    console.log('info:', info, 'users:', users);
    res.render('admin/dashboard', { info, users }); // ← Pass users to EJS
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
