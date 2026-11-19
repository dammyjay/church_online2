// Helpers for showing text that visitors typed (FAQ questions, comments, testimonies)
// without letting any HTML or <script> in it run.

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Rich-text (e.g. from CKEditor) -> safe HTML that keeps the words and line breaks
// but drops all markup. Use as <%- plainText(value) %>.
function plainText(html) {
  return escapeHtml(
    String(html ?? "")
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<br\s*\/?>|<\/(p|div|li|h[1-6])>/gi, "\n")
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(code))
      .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
      .replace(/&(quot|apos|#39|lt|gt|amp);/gi, (m, name) =>
        ({ quot: '"', apos: "'", "#39": "'", lt: "<", gt: ">", amp: "&" })[name.toLowerCase()]
      )
      .replace(/[ \t]+/g, " ")
      .replace(/ *\n[\s]*/g, "\n")
      .trim()
  ).replace(/\n/g, "<br>");
}

module.exports = { escapeHtml, plainText };
