// Link-preview (Open Graph / Twitter card) data for every page.
// layout.ejs turns res.locals.meta into <meta> tags, so links pasted into
// WhatsApp, Facebook, X, Telegram, etc. show a title, description and image.
const pool = require("../models/db");

const SITE_NAME = "C&S Church Online";
const DEFAULT_DESCRIPTION =
  "Empowering lives through the gospel of Christ. Join us to learn, grow and connect with a family of faith.";

// ministry_info rarely changes, so don't query it on every request
const INFO_TTL_MS = 5 * 60 * 1000;
let infoCache = { value: null, fetchedAt: 0 };

async function getMinistryInfo() {
  if (infoCache.value && Date.now() - infoCache.fetchedAt < INFO_TTL_MS) {
    return infoCache.value;
  }
  try {
    const result = await pool.query(
      "SELECT vision, logo_url, hero_image_url FROM ministry_info ORDER BY id DESC LIMIT 1"
    );
    infoCache = { value: result.rows[0] || {}, fetchedAt: Date.now() };
  } catch (err) {
    console.error("pageMeta: could not load ministry_info:", err.message);
    infoCache = { value: infoCache.value || {}, fetchedAt: Date.now() };
  }
  return infoCache.value;
}

const ENTITIES = {
  nbsp: " ", amp: "&", quot: '"', apos: "'", lt: "<", gt: ">",
  rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“",
  ndash: "–", mdash: "—", hellip: "…",
};

// Turn stored rich-text HTML into a short plain-text summary
function toPlainText(html, maxLength = 200) {
  if (!html) return "";
  let text = String(html)
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(code))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (match, name) => ENTITIES[name.toLowerCase()] ?? match)
    .replace(/\s+/g, " ")
    .trim();

  if (text.length > maxLength) {
    const cut = text.slice(0, maxLength);
    text = cut.slice(0, cut.lastIndexOf(" ") > 0 ? cut.lastIndexOf(" ") : maxLength).trim() + "…";
  }
  return text;
}

// Uppercase titles ("AS IN THE DAYS OF NOAH") read better as title case in previews
function toTitleCase(text) {
  if (!text || text !== text.toUpperCase()) return text;
  return text.toLowerCase().replace(/(^|[\s(\-"'“])([a-z])/g, (m, sep, ch) => sep + ch.toUpperCase());
}

function siteOrigin(req) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/+$/, "");
  return `${req.protocol}://${req.get("host")}`;
}

function absoluteUrl(req, url) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("//")) return req.protocol + ":" + url;
  return siteOrigin(req) + (url.startsWith("/") ? url : "/" + url);
}

// Thumbnail for a YouTube watch / youtu.be / shorts / embed URL
function youtubeThumbnail(url) {
  if (!url) return "";
  const match = String(url).match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/
  );
  return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : "";
}

async function pageMeta(req, res, next) {
  const info = await getMinistryInfo();

  res.locals.currentUser = req.session.user || null;
  res.locals.meta = {
    siteName: SITE_NAME,
    title: SITE_NAME,
    fullTitle: SITE_NAME,
    description: toPlainText(info.vision, 200) || DEFAULT_DESCRIPTION,
    // Animated GIFs often don't show in WhatsApp previews, so fall back to the banner photo
    image: absoluteUrl(
      req,
      (info.hero_image_url && !/\.gif($|\?)/i.test(info.hero_image_url) && info.hero_image_url) || "/banner.jpg"
    ),
    url: siteOrigin(req) + req.originalUrl.split("?")[0],
    type: "website",
  };

  // Pages call res.setMeta({ title, description, image, type }) before rendering
  res.setMeta = (overrides) => {
    const meta = res.locals.meta;
    if (overrides.title) {
      meta.title = toTitleCase(toPlainText(overrides.title, 120));
      meta.fullTitle = `${meta.title} | ${SITE_NAME}`;
    }
    if (overrides.description) {
      meta.description = toPlainText(overrides.description, 200) || meta.description;
    }
    if (overrides.image) meta.image = absoluteUrl(req, overrides.image);
    if (overrides.type) meta.type = overrides.type;
    if (overrides.publishedTime) meta.publishedTime = new Date(overrides.publishedTime).toISOString();
  };

  next();
}

module.exports = pageMeta;
module.exports.toPlainText = toPlainText;
module.exports.youtubeThumbnail = youtubeThumbnail;
