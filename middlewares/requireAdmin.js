// Only let logged-in admins through; everyone else goes to the login page.
const requireAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.role === "admin") {
    return next();
  }

  // Send GET requests back to the page they wanted after logging in
  const redirect =
    req.method === "GET" ? "?redirect=" + encodeURIComponent(req.originalUrl) : "";
  res.redirect("/admin/login" + redirect);
};

module.exports = requireAdmin;
