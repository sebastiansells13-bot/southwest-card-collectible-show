// Floor-map table picker on /vendors/ (markup: components/table-picker.njk).
// Vendors tap open tables or type numbers, then send a request. Nothing is
// reserved here — the organizer confirms and marks tables in the CMS.
// Runs after DOMContentLoaded so i18n-runtime.js (window.t) is loaded even
// though this script tag comes first in the page.
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("booking-form");
  if (!form) return;
  const t = window.t || ((key) => key);
  const input = document.getElementById("tables-input");
  const msg = document.getElementById("tables-msg");
  const max = Number(form.dataset.max) || 4;
  const buttons = new Map([...document.querySelectorAll(".floor__table")].map((b) => [b.dataset.table, b]));
  let picked = [];
  let note = null; // last status message as [key, vars], re-rendered on a language switch

  const isOpen = (n) => buttons.has(n) && !buttons.get(n).disabled;
  const tablesText = () => t(picked.length > 1 ? "done.tablesN" : "done.tables1", { list: picked.join(", ") });

  function say(key, vars) {
    note = key ? [key, vars] : null;
    msg.textContent = key ? t(key, vars) : "";
  }

  function render() {
    buttons.forEach((b, n) => {
      if (b.disabled) return;
      const on = picked.includes(n);
      b.classList.toggle("is-selected", on);
      b.setAttribute("aria-pressed", on);
    });
    input.value = picked.join(", ");
    if (picked.length) say(picked.length > 1 ? "picker.selectedN" : "picker.selected1", { count: picked.length });
    else say(null);
  }

  buttons.forEach((b, n) => {
    if (b.disabled) return;
    b.addEventListener("click", () => {
      if (picked.includes(n)) picked = picked.filter((p) => p !== n);
      else if (picked.length >= max) return say("picker.max", { max });
      else picked.push(n);
      picked.sort((a, b) => a - b);
      render();
    });
  });

  input.addEventListener("change", () => {
    const typed = [...new Set(input.value.match(/\d+/g) || [])];
    const bad = typed.filter((n) => !isOpen(n));
    picked = typed.filter(isOpen).slice(0, max).sort((a, b) => a - b);
    render();
    if (bad.length) say("picker.notAvailable", { list: bad.join(", ") });
  });

  // The summary is for the organizer, so it stays in English whatever
  // language the vendor is browsing in (it notes their language instead).
  function summary(data) {
    const line = (k, label) => (data.get(k) ? `${label}: ${data.get(k)}\n` : "");
    return `TABLE REQUEST — ${data.get("show")}\nTables: ${picked.join(", ")}\n` +
      line("name", "Name") + line("business", "Business") + line("email", "Email") +
      line("phone", "Phone") + line("instagram", "Instagram") +
      (data.getAll("selling").length ? `Selling: ${data.getAll("selling").join(", ")}\n` : "") +
      line("notes", "Notes") + (data.get("language") === "es" ? "Language: Spanish\n" : "");
  }

  function done(sent, data) {
    form.hidden = true;
    const box = document.getElementById("booking-done");
    box.hidden = false;
    box.querySelectorAll("[data-done-tables]").forEach((el) => (el.textContent = tablesText()));
    document.getElementById(sent ? "done-sent" : "done-manual").hidden = false;
    if (!sent) document.getElementById("done-summary").value = summary(data);
    box.focus();
  }

  document.getElementById("copy-summary").addEventListener("click", async (e) => {
    const area = document.getElementById("done-summary");
    try { await navigator.clipboard.writeText(area.value); } catch { area.select(); document.execCommand("copy"); }
    e.target.textContent = t("done.copied");
  });

  const err = document.getElementById("form-error");
  let errKey = null;
  function showError(key) {
    errKey = key;
    err.textContent = key ? t(key) : "";
    err.hidden = !key;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    input.dispatchEvent(new Event("change"));
    const missing = [...form.querySelectorAll("[required]")].filter((f) => !f.value.trim() || !f.checkValidity());
    if (!picked.length || missing.length) {
      showError(!picked.length ? "picker.pickOne" : "form.needContact");
      (missing[0] || input).focus();
      return;
    }
    showError(null);
    form.elements.language.value = window.i18nLang ? window.i18nLang() : "en";
    const data = new FormData(form);
    data.set("tables", picked.join(", "));
    if (!form.dataset.endpoint) return done(false, data);
    // One request per click: block double submits while it's in flight.
    const submit = form.querySelector('[type="submit"]');
    if (submit.disabled) return;
    submit.disabled = true;
    try {
      const res = await fetch(form.dataset.endpoint, { method: "POST", body: data, headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(res.status);
      done(true, data);
    } catch {
      done(false, data);
    } finally {
      submit.disabled = false;
    }
  });

  window.addEventListener("lang:changed", () => {
    if (note) say(note[0], note[1]);
    if (errKey) showError(errKey);
    document.querySelectorAll("[data-done-tables]").forEach((el) => { if (el.textContent) el.textContent = tablesText(); });
  });
});
