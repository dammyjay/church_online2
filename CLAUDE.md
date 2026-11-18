# CLAUDE.md

This file guides Claude Code (claude.ai/code) when it works in this repository.

## Overview

A church/ministry website (package name `ministry-webapp`). It is a server-rendered Express 5 + EJS app backed by PostgreSQL. It has public pages (home, articles, videos, devotionals, FAQ, testimonies, about) and an `/admin` area for managing that content. Images go to Cloudinary. The app sends email through Gmail SMTP, web push through VAPID, and devotionals to a Telegram channel.

## Commands

```bash
npm install
npm start          # node app.js — listens on PORT (default 3000)
```

There is no build step, test suite, linter, or nodemon. You have to restart the server by hand after changes.

## Environment (.env)

`dotenv` is loaded on the first line of `app.js`.

Required variables:
- `DATABASE_URL`: Postgres connection string. SSL is on with `rejectUnauthorized: false` (Railway-hosted).
- `SESSION_SECRET`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `EMAIL_USER`, `EMAIL_PASS`: Gmail SMTP credentials (app password).
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHANNEL_ID`: optional. Telegram sending is skipped silently when they are missing.
- `ADMIN_EMAIL`: optional. Receives new FAQ and testimony alerts (falls back to the address in `utils/sendEmail.js`).
- `SITE_URL`: optional, e.g. `https://cschurchonline.org`. Base for link-preview URLs. Without it, the request's protocol and host are used (`trust proxy` is on, so this gives `https` behind Railway).
- `PORT`: optional.

Never commit `.env`. Note that `node_modules/` **is** tracked in git.

## Architecture

```
app.js            Express setup, session, route mounting, starts cron jobs, runs createTables()
models/db.js      Shared pg Pool (import as `const pool = require("../models/db")`)
models/initTables.js  CREATE TABLE IF NOT EXISTS for a few tables only (see Database)
routes/           Express routers; some contain inline SQL handlers, others delegate to controllers
controllers/      Request handlers (exports.fnName = async (req, res) => {...}), raw SQL via pool.query
middlewares/upload.js  multer + CloudinaryStorage (folder "ministry-logos", jpg/jpeg/png)
middlewares/requireAdmin.js  redirects to /admin/login unless session user has role "admin"
middlewares/pageMeta.js  link-preview defaults (res.locals.meta), res.setMeta(), res.locals.currentUser
utils/            cloudinary config, sendEmail (nodemailer), telegram, webpushConfig
cron/             node-cron jobs, both every 5 minutes
views/            EJS templates; views/admin/* for admin pages, views/partials/*
public/           Static assets, css/style.css, sw.js (push service worker)
```

### Patterns and conventions
- **Raw SQL only.** There is no ORM and no migration tool. Queries are parameterized with `$1, $2…`.
- Almost every page handler first loads `SELECT * FROM ministry_info ORDER BY id DESC LIMIT 1` and passes it as `info`. Views use it for the logo, hero image and marquee text.
- **Uploads:** routes use `upload.single("field")` / `upload.fields(...)` from `middlewares/upload.js`. With CloudinaryStorage, `req.file.path` is already the Cloudinary URL. Some controllers (for example devotionals) re-upload `req.file.path` through `cloudinary.uploader.upload`, which works but is redundant.
- **Layouts:** `express-ejs-layouts` wraps every render in [views/layout.ejs](views/layout.ejs), which also registers `/sw.js` and subscribes to push. Most views are still complete HTML documents of their own; tags in a view's own `<head>` end up inside `<body>`, so anything that must be in the real `<head>` goes in `layout.ejs`.
- **Link previews:** `layout.ejs` renders Open Graph / Twitter tags from `res.locals.meta`, which [middlewares/pageMeta.js](middlewares/pageMeta.js) fills with site defaults. A page that represents one item calls `res.setMeta({ title, description, image, type })` before `res.render`. It strips HTML, decodes entities, title-cases ALL-CAPS titles, and makes image URLs absolute. For YouTube, use `youtubeThumbnail(url)` from the same module.
- **Shareable item URLs:** `/articles/:id`, `/videos/:id`, `/devotionals/:id`, `/faq/:id` (opens and highlights that question) and `/testimony/:id` (opens that testimony's modal).
- **Sharing:** call `shareLink(path, title)` (defined in `layout.ejs`). It opens the native share sheet on phones and copies the link (with a toast) elsewhere. Use a `<button type="button" class="share-btn">` (add `share-btn--sm` in cards).
- **Shared partials:** `views/partials/siteHeader.ejs` (`include('partials/siteHeader', { active: 'videos' })`) and `siteFooter.ejs`. They're used by the newer pages (devotional, video). Older pages still have their own copy of the header and footer.
- **Embedding data in pages:** don't put `JSON.stringify(...)` inside an `onclick` attribute; quotes in the data break it. Put a `const DATA = <%- JSON.stringify(...).replace(/</g, '\\u003c') %>` map in a `<script>` and pass only the id (see `testimony.ejs`, `admin/dashboard.ejs`). Never send `users2.password` or reset tokens to the browser.
- **UI building blocks** (all in `public/css/style.css`, end of file):
  - **Modals:** `.modal > .modal-content` with a `<span class="close">` inside. Open them with `el.style.display = "flex"` (not `"block"`, which breaks the centring).
  - **Full-screen images:** use `.img-modal`.
  - **Auth pages** (login, signup, forgot/reset): `.auth-page > .auth-card` with `.auth-field` / `.auth-input` / `.auth-submit`.
  - **Loading state:** a `.spinner` inside a button with the `is-loading` class.
  - **Single-item pages:** `.page > .detail-card` with `.eyebrow`, `.detail-title`, `.detail-body`, `.detail-actions`.
  - **"Design refresh" section:** restyles the shared components every page uses (header/nav, `.section`, cards, buttons, inputs, tables, footer). It overrides the older rules above it, so put new shared styling there, not in the older parts of the file.
- **Auth:** session-based, using `express-session` with the default MemoryStore. One login (`/admin/login`, [controllers/adminController.js](controllers/adminController.js)) serves both admins and members. It sets `req.session.user = { id, email, role, profile_pic }`. Admins are redirected to `/admin/dashboard`, other users to `/home2`. Login only follows a `?redirect=` that is a local path.
- **Admin guard:** in `routes/adminRoutes.js`, `router.use(requireAdmin)` protects every route below the login, logout, forgot-password and reset-password routes. Add new admin routes below that line. Admin routes in other routers (`videoRoutes`, `adminFaqRoutes`, `adminTestimonyRoutes`) pass `requireAdmin` on each route. Do the same in any new router, because those routers are mounted at `/` and a `router.use` there would gate public pages too.
- **Signup** ([controllers/userController.js](controllers/userController.js)): the form writes to `pending_users` with an emailed 6-digit OTP. `POST /verify-otp` then copies the row into `users2`. Passwords are hashed with bcrypt.
- **Email:** `utils/sendEmail.js` exports `{ sendEmail, sendFaqAnswerEmail }`. Import it with destructuring: `const { sendEmail } = require("../utils/sendEmail")`.
- YouTube URLs are converted to embed URLs inline in `routes/publicRoutes.js` (it handles `watch?v=`, `youtu.be/` and bare 11-character IDs).

### Route mounting (order matters — first match wins)
`app.js` mounts routers in this order: `publicRoutes` (`/`), `adminRoutes` (`/admin`), `videoRoutes` (`/admin`), `userRoutes` (`/`), `subscribeRoutes` (`/`), `adminFaqRoutes` (`/`, which uses full `/admin/faqs...` paths), `adminTestimonyRoutes` (`/`, with `/admin/testimonies...`), `publicVideoRoutes`, `interactionRoutes` (`/interaction`), and `notificationRoutes` (`/notifications`).

- All public pages (`/`, `/faq`, `/testimony`, `/articles`, `/articles/:id`, `/videos`, `/devotionals`, `/about`, ...) are in `routes/publicRoutes.js`. `/videos/:id` is the exception: it lives in `publicVideoRoutes.js`. `/testimonies` redirects to `/testimony`.
- `/profile` (userController) serves both members and admins with one view, `userProfile.ejs`. `/admin/profile` redirects there.
- `POST /subscribe` serves two forms. `userRoutes.js` handles browser push subscriptions (a JSON body with `endpoint`) and stores them in `subscriptions`. Anything else falls through via `next()` to `subscribeRoutes.js`, which saves the email newsletter form into `subscribers`.
- `routes/ministryRoutes.js` is not mounted. `/admin/ministry` lives in `adminRoutes.js`.

### Background jobs (started in app.js)
- [cron/cronJobs.js](cron/cronJobs.js): every 5 minutes it finds devotionals with `visible = false AND scheduled_at <= now AND sent_to_telegram = false`, posts them to Telegram, and sets `visible = true, sent_to_telegram = true`. Devotionals saved with no schedule are visible right away and are sent to Telegram on save.
- [cron/newsletterScheduler.js](cron/newsletterScheduler.js): every 5 minutes it emails unsent newsletters whose `scheduled_at` has passed to **every** email in `users2`, then sets `sent = true`.

Cron runs inside the web process, so running several instances would send duplicates.

## Database

Main tables: `users2`, `pending_users`, `ministry_info`, `articles`, `videos4`, `demo_videos2`, `devotionals`, `announcements`, `newsletters`, `faqs`, `testimonies`, `gallery_images`, `gallery_categories`, `likes`, `comments`, `subscribers`, `subscriptions`, `push_subscriptions`.

- Only `likes`, `comments`, `push_subscriptions`, `subscriptions`, `devotionals` and `testimonies` are created by `initTables.js`. The other tables already exist in the hosted DB and have no schema in the repo. Use `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` in `initTables.js` for schema changes.
- Table and column names carry version suffixes. Use the ones the code uses: `users2`, `videos4`, `demo_videos2`, and `created_at3` for ordering articles and videos (some admin queries use `articles.created_at`).
- `devotionals` columns used in code are `scheduled_at` and `visible`. The `CREATE TABLE` in `initTables.js` has the typo `sheduled_at` and no `visible`, so the live DB schema differs from that file.
- About 50 old devotionals have neither `created_at` nor `scheduled_at`. Sort with `ORDER BY created_at DESC NULLS LAST, id DESC`, and display `scheduled_at || created_at`, guarding against null. Public devotional queries filter on `visible = true` so scheduled ones aren't published early.
- Push subscriptions live in `subscriptions` (keys as JSONB), and all senders read from it. `push_subscriptions` is legacy: on startup `initTables.js` copies its rows into `subscriptions`.
- Devotionals are edited through a modal on `admin/devotionals.ejs` (`POST /admin/devotionals/edit/:id`). There is no separate edit page.
- `likes` / `comments` are polymorphic: `content_type IN ('article','video')` plus `content_id`.

## Code style notes

- Large blocks of commented-out old code are common. The live implementation is usually the last definition in the file.
- Admin alert emails use `ADMIN_EMAIL` from `utils/sendEmail.js`. Don't hardcode addresses.
