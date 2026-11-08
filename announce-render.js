/* Living Word Fellowship — shared announcement formatting
   Weekly text rules:  "# " = heading,  "- " = bullet,  **text** = bold,  blank line = new paragraph. */
(function () {
  function escapeHtml(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function inline(s) {
    return escapeHtml(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  }
  function renderWeekly(raw) {
    var lines = String(raw || "").replace(/\r\n/g, "\n").split("\n");
    var html = "", para = [], list = [];
    function flushPara() { if (para.length) { html += "<p>" + para.map(inline).join("<br>") + "</p>"; para = []; } }
    function flushList() { if (list.length) { html += "<ul>" + list.map(function (i) { return "<li>" + inline(i) + "</li>"; }).join("") + "</ul>"; list = []; } }
    lines.forEach(function (line) {
      var t = line.trim();
      if (t === "") { flushPara(); flushList(); }
      else if (t.indexOf("# ") === 0) { flushPara(); flushList(); html += "<h3>" + inline(t.slice(2)) + "</h3>"; }
      else if (t.indexOf("- ") === 0 || t.indexOf("* ") === 0) { flushPara(); list.push(t.slice(2)); }
      else { flushList(); para.push(t); }
    });
    flushPara(); flushList();
    return html;
  }
  function renderDigital(items) {
    return (items || []).map(function (d) {
      var cap = d.caption ? "<figcaption>" + escapeHtml(d.caption) + "</figcaption>" : "";
      return '<figure class="digital-announce-card"><img src="' + escapeHtml(d.src) + '" alt="' +
        escapeHtml(d.caption || "Living Word Fellowship announcement flyer") + '" loading="lazy">' + cap + "</figure>";
    }).join("");
  }
  window.LWFAnnounce = { renderWeekly: renderWeekly, renderDigital: renderDigital, escapeHtml: escapeHtml };
})();
