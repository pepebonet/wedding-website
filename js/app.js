/* =========================================================================
   Evi & Pepe — app logic
   ========================================================================= */

/* ----------------------------------------------------------------------
   CONFIG — edit these as the real details land.
   ---------------------------------------------------------------------- */
const CONFIG = {
  // Paste the deployed Google Apps Script web-app URL here when ready.
  // While it stays as the placeholder below, the form runs in DEMO MODE:
  // submissions are logged to the browser console instead of being sent.
  GOOGLE_APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbxt1Dib7GYhMlUnDWKZ7bE0_6u-yVo1WswkChZalFWYb_OZy_UgrB5e2OVfyB3dwCKfoQ/exec",

  // Wedding day — Fri 28 May 2027, ceremony ~18:00 local (Europe/Madrid, UTC+2).
  WEDDING_DATE: new Date("2027-05-28T18:00:00+02:00"),

  DEFAULT_LANG: "en",
  SUPPORTED_LANGS: ["en", "es", "de"],

  // Timeline rows to emphasise (bus departure, early + final return).
  TIMELINE_HIGHLIGHT: [0, 5, 6],
};

/* ----------------------------------------------------------------------
   Small helpers
   ---------------------------------------------------------------------- */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// true once a real Apps Script web-app URL has been set in CONFIG
function rsvpEndpointConfigured() {
  const url = CONFIG.GOOGLE_APPS_SCRIPT_URL;
  return !!url && /^https?:\/\//.test(url) && !url.includes("PASTE_YOUR");
}

// resolve "a.b.c" against the active language dictionary
let LANG = CONFIG.DEFAULT_LANG;
function t(path) {
  return path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), window.I18N[LANG]);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

// render a string into an element; turns the {{TBD}} token into a badge
function applyText(el, str) {
  if (str == null) return;
  if (String(str).includes("{{TBD}}")) {
    el.innerHTML = escapeHtml(str).replace(/\{\{TBD\}\}/g, '<span class="tbd">TBD</span>');
  } else {
    el.textContent = str;
  }
}

/* ----------------------------------------------------------------------
   Language rendering
   ---------------------------------------------------------------------- */
function render() {
  document.documentElement.lang = LANG;

  // static text nodes
  $$("[data-i18n]").forEach((el) => applyText(el, t(el.dataset.i18n)));

  // input/textarea placeholders
  $$("[data-i18n-ph-attr]").forEach((el) => {
    const val = t(el.dataset.i18nPhAttr);
    if (val != null) el.setAttribute("placeholder", val);
  });

  renderTimeline();
  renderGtk();
  renderFaq();

  // IBAN value
  applyText($("#ibanVal"), t("gifts.iban"));

  // active state on every language switcher
  $$(".lang-btn").forEach((b) => b.classList.toggle("active", b.dataset.lang === LANG));
}

function renderTimeline() {
  const ol = $("#timeline");
  ol.innerHTML = "";
  (t("schedule.items") || []).forEach((it, i) => {
    const li = document.createElement("li");
    li.className = "tl-item" + (CONFIG.TIMELINE_HIGHLIGHT.includes(i) ? " highlight" : "");
    li.innerHTML = `<div class="tl-time">${escapeHtml(it.time)}</div><div class="tl-label">${escapeHtml(it.label)}</div>`;
    ol.appendChild(li);
  });
}

function renderGtk() {
  const grid = $("#gtkGrid");
  grid.innerHTML = "";
  (t("gtk.items") || []).forEach((it) => {
    const div = document.createElement("div");
    div.className = "gtk-card";
    div.innerHTML = `<h3>${escapeHtml(it.t)}</h3><p>${escapeHtml(it.d)}</p>`;
    grid.appendChild(div);
  });
}

function renderFaq() {
  const list = $("#faqList");
  // preserve which items were open across re-render
  const openIdx = $$(".faq-item.open", list).map((el) => +el.dataset.idx);
  list.innerHTML = "";
  (t("faq.items") || []).forEach((it, i) => {
    const item = document.createElement("div");
    item.className = "faq-item" + (openIdx.includes(i) ? " open" : "");
    item.dataset.idx = i;
    item.innerHTML = `
      <button class="faq-q" type="button">
        <span>${escapeHtml(it.q)}</span>
        <span class="chev">+</span>
      </button>
      <div class="faq-a"><div>${escapeHtml(it.a).replace(/\{\{TBD\}\}/g, '<span class="tbd">TBD</span>')}</div></div>`;
    const ans = $(".faq-a", item);
    $(".faq-q", item).addEventListener("click", () => {
      item.classList.toggle("open");
      ans.style.maxHeight = item.classList.contains("open") ? ans.scrollHeight + "px" : "0";
    });
    if (item.classList.contains("open")) ans.style.maxHeight = "none";
    list.appendChild(item);
  });
}

function setLang(lang) {
  if (!CONFIG.SUPPORTED_LANGS.includes(lang)) return;
  LANG = lang;
  try { localStorage.setItem("ep_lang", lang); } catch (e) {}
  render();
}

/* ----------------------------------------------------------------------
   Countdown
   ---------------------------------------------------------------------- */
function tickCountdown() {
  const diff = CONFIG.WEDDING_DATE - new Date();
  if (diff <= 0) {
    $("#cdGrid").classList.add("hidden");
    $("#cdMarried").classList.remove("hidden");
    return;
  }
  const s = Math.floor(diff / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  $("#cd-days").textContent  = d;
  $("#cd-hours").textContent = String(h).padStart(2, "0");
  $("#cd-mins").textContent  = String(m).padStart(2, "0");
  $("#cd-secs").textContent  = String(sec).padStart(2, "0");
}

/* ----------------------------------------------------------------------
   Gallery + lightbox
   ---------------------------------------------------------------------- */
const GALLERY = ["01", "03", "04", "05", "06", "08"].map((n, i) => (
  { src: `images/gallery-${n}.webp`, alt: `Evi & Pepe — photo ${i + 1}` }
));
function buildGallery() {
  const g = $("#gallery");
  GALLERY.forEach((p) => {
    const img = document.createElement("img");
    img.src = p.src; img.alt = p.alt; img.loading = "lazy";
    img.className = "gal-img";
    img.addEventListener("click", () => openLightbox(p.src, p.alt));
    g.appendChild(img);
  });
}
function openLightbox(src, alt) {
  $("#lbImg").src = src;
  $("#lbImg").alt = alt;
  $("#lightbox").classList.add("show");
}
function closeLightbox() { $("#lightbox").classList.remove("show"); }

/* ----------------------------------------------------------------------
   IBAN copy
   ---------------------------------------------------------------------- */
function copyIban() {
  const val = $("#ibanVal").textContent.trim();
  const done = () => {
    const btn = $("#ibanCopy");
    const orig = t("gifts.copy");
    btn.textContent = t("gifts.copied");
    setTimeout(() => (btn.textContent = orig), 1800);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(val).then(done).catch(done);
  } else {
    const ta = document.createElement("textarea");
    ta.value = val; document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(ta); done();
  }
}

/* ----------------------------------------------------------------------
   RSVP form
   ---------------------------------------------------------------------- */
function setupRsvp() {
  const form = $("#rsvpForm");
  const ifYes = $("#ifYes");
  const msg = $("#rsvpMsg");

  // the "demo mode" note is only relevant until the endpoint is wired up
  const demoNote = $("#rsvpDemoNote");
  if (demoNote && rsvpEndpointConfigured()) demoNote.classList.add("hidden");

  // show/hide conditional block based on attending
  function syncAttending() {
    const val = (form.querySelector('input[name="attending"]:checked') || {}).value;
    ifYes.classList.toggle("hidden", val !== "yes");
  }
  $$('input[name="attending"]', form).forEach((r) => r.addEventListener("change", syncAttending));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.className = "hidden";

    if (!form.reportValidity()) return;

    const fd = new FormData(form);
    const data = {
      name: fd.get("name") || "",
      email: fd.get("email") || "",
      attending: fd.get("attending") || "",
      party: fd.get("party") || "",
      dietary: fd.get("dietary") || "",
      events: fd.getAll("events"),
      olympia: fd.get("olympia") || "",
      bus: fd.get("bus") || "",
      returnBus: fd.get("returnBus") || "",
      song: fd.get("song") || "",
      message: fd.get("message") || "",
      lang: LANG,
      submittedAt: new Date().toISOString(),
    };

    const btn = $("#rsvpSubmit");
    const origLabel = btn.textContent;
    btn.disabled = true;
    btn.textContent = t("rsvp.sending");

    try {
      if (!rsvpEndpointConfigured()) {
        // DEMO MODE — no endpoint yet. Log so the UI is fully testable locally.
        console.log("[RSVP demo] endpoint not configured — submission:", data);
        await new Promise((r) => setTimeout(r, 500));
      } else {
        // Apps Script web apps redirect through googleusercontent.com, which
        // doesn't send CORS headers — so use no-cors. The request still reaches
        // the script (the row is written); the response is opaque, which is fine
        // because we don't need to read it. Body stays text/plain (a "simple"
        // request) so there's no preflight.
        await fetch(CONFIG.GOOGLE_APPS_SCRIPT_URL, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(data),
        });
        console.log("[RSVP] submitted:", data);
      }
      msg.textContent = t("rsvp.success");
      msg.className = "ok text-center font-medium rounded-lg px-4 py-3";
      form.reset();
      syncAttending();
    } catch (err) {
      console.error("[RSVP] error:", err);
      msg.textContent = t("rsvp.error");
      msg.className = "err text-center font-medium rounded-lg px-4 py-3";
    } finally {
      btn.disabled = false;
      btn.textContent = origLabel;
    }
  });

  syncAttending();
}

/* ----------------------------------------------------------------------
   Nav: scroll state, hamburger, reveal animations, hero load
   ---------------------------------------------------------------------- */
function setupChrome() {
  const nav = $("#nav");
  const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 40);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const menu = $("#mobileMenu");
  const open = () => menu.classList.remove("translate-x-full");
  const close = () => menu.classList.add("translate-x-full");
  $("#menuBtn").addEventListener("click", () =>
    menu.classList.contains("translate-x-full") ? open() : close()
  );
  $$(".mm-link").forEach((a) => a.addEventListener("click", close));

  // dev aid: ?noanim reveals everything immediately (used for screenshot QA);
  // also caps the 100svh hero so a full-page screenshot has natural proportions.
  const noAnim = location.search.includes("noanim");
  if (noAnim) {
    $$(".reveal").forEach((el) => el.classList.add("in"));
    const hero = $("#hero");
    if (hero) { hero.style.height = "720px"; hero.style.minHeight = "0"; }
    const ym = location.search.match(/[?&]y=(\d+)/);
    if (ym) setTimeout(() => window.scrollTo(0, +ym[1]), 50);
  }

  // reveal on scroll
  const io = new IntersectionObserver(
    (entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
    }),
    { threshold: 0.12 }
  );
  $$(".reveal").forEach((el) => io.observe(el));

  // hero image fade-in
  const hero = $(".hero-img");
  if (hero) {
    if (hero.complete) hero.classList.add("loaded");
    else hero.addEventListener("load", () => hero.classList.add("loaded"));
  }

  // lightbox close
  $("#lbClose").addEventListener("click", closeLightbox);
  $("#lightbox").addEventListener("click", (e) => { if (e.target.id === "lightbox") closeLightbox(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeLightbox(); });

  // language buttons
  $$(".lang-btn").forEach((b) => b.addEventListener("click", () => setLang(b.dataset.lang)));

  // IBAN copy
  $("#ibanCopy").addEventListener("click", copyIban);
}

/* ----------------------------------------------------------------------
   Init
   ---------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  // pick saved language, else browser hint, else default
  let lang = CONFIG.DEFAULT_LANG;
  try {
    const saved = localStorage.getItem("ep_lang");
    if (saved && CONFIG.SUPPORTED_LANGS.includes(saved)) lang = saved;
    else {
      const nav2 = (navigator.language || "").slice(0, 2);
      if (CONFIG.SUPPORTED_LANGS.includes(nav2)) lang = nav2;
    }
  } catch (e) {}
  LANG = lang;

  buildGallery();
  render();
  setupChrome();
  setupRsvp();

  tickCountdown();
  setInterval(tickCountdown, 1000);
});
