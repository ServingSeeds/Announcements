/* Living Word Fellowship — Church Calendar data: read from the page, and draw from saved data. */
(function () {
  var DEPTS = { church: "LWF Church", youth: "Youth", district: "D.D. Chandler District" };
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function txt(el) { return el ? el.textContent.replace(/\s+/g, " ").trim() : ""; }

  // Turn web addresses and phone numbers in a line into tappable links
  function linkify(line) {
    var out = esc(line);
    out = out.replace(/(https?:\/\/[^\s<]+|\b(?:[a-z0-9-]+\.)+(?:com|org|net|us|gov)(?:\/[^\s<]*)?)/gi, function (m) {
      var href = /^https?:/i.test(m) ? m : "https://" + m;
      return '<a href="' + href + '" target="_blank" rel="noopener">' + m + "</a>";
    });
    out = out.replace(/(\+?1[\s-]?)?\(?\b(\d{3})\)?[\s-](\d{3})-(\d{4})\b/g, function (m, c, a, b, d) {
      return '<a href="tel:+1' + a + b + d + '">' + m + "</a>";
    });
    return out;
  }

  /* Read the calendar that is written into calendar.html */
  function parse(doc) {
    var data = { subtitle: txt(doc.querySelector(".hero p")), recurring: [], youth: [], months: [] };
    var sections = doc.querySelectorAll("#cal-root section");
    Array.prototype.forEach.call(sections, function (sec) {
      var h = txt(sec.querySelector("h2")).toLowerCase();
      if (h.indexOf("month") >= 0) {
        Array.prototype.forEach.call(sec.querySelectorAll(".month-card"), function (mc) {
          var m = { name: txt(mc.querySelector("h3")), events: [] };
          Array.prototype.forEach.call(mc.querySelectorAll(".dept-block"), function (b) {
            var dept = /dept-youth/.test(b.className) ? "youth" : /dept-district/.test(b.className) ? "district" : "church";
            Array.prototype.forEach.call(b.querySelectorAll("li"), function (li) {
              var tag = li.querySelector(".tag"), date = txt(tag).replace(/:$/, "");
              var clone = li.cloneNode(true); var t = clone.querySelector(".tag"); if (t) t.remove();
              m.events.push({ dept: dept, date: date, text: txt(clone) });
            });
          });
          data.months.push(m);
        });
      } else {
        var list = h.indexOf("youth") >= 0 ? data.youth : data.recurring;
        Array.prototype.forEach.call(sec.querySelectorAll(".card"), function (c) {
          var det = c.querySelector(".login-details"), lines = [];
          if (det) Array.prototype.forEach.call(det.querySelectorAll("p"), function (p) { lines.push(txt(p)); });
          list.push({ title: txt(c.querySelector("h3")), when: txt(c.querySelector(":scope > p")), details: lines.join("\n") });
        });
      }
    });
    return data;
  }

  function cardHtml(c) {
    var lines = String(c.details || "").split("\n").map(function (l) { return l.trim(); }).filter(Boolean);
    var det = lines.length ? '<div class="login-details">' + lines.map(function (l, i) {
      return i === 0 ? '<p class="login-title">' + linkify(l) + "</p>" : "<p>" + linkify(l) + "</p>";
    }).join("") + "</div>" : "";
    return '<div class="card"><h3>' + esc(c.title) + "</h3>" + (c.when ? "<p>" + esc(c.when) + "</p>" : "") + det + "</div>";
  }
  function monthHtml(m) {
    var html = '<div class="card month-card"><h3>' + esc(m.name) + "</h3>";
    ["church", "youth", "district"].forEach(function (d) {
      var evs = (m.events || []).filter(function (e) { return (e.dept || "church") === d && (e.text || e.date); });
      if (!evs.length) return;
      html += '<div class="dept-block dept-' + d + '"><span class="dept-badge">' + DEPTS[d] + "</span><ul>" +
        evs.map(function (e) { return "<li>" + (e.date ? '<span class="tag">' + esc(e.date) + ":</span>" : "") + esc(e.text) + "</li>"; }).join("") +
        "</ul></div>";
    });
    return html + "</div>";
  }
  function render(data) {
    var out = "";
    if ((data.recurring || []).length) out += '<section><h2>Recurring LWF Church Events</h2><div class="card-grid">' + data.recurring.map(cardHtml).join("") + "</div></section>";
    if ((data.youth || []).length) out += '<section><h2>Recurring Youth Meetings</h2><div class="card-grid">' + data.youth.map(cardHtml).join("") + "</div></section>";
    out += '<section><h2>Month by Month</h2><div class="card-grid" id="calendar-grid">' + (data.months || []).map(monthHtml).join("") + "</div></section>";
    return out;
  }
  window.LWFCal = { parse: parse, render: render, DEPTS: DEPTS, esc: esc };
})();
