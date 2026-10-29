// Home hero countdown to the next show's doors (components/countdown in
// index.njk). Counts in the visitor's clock against the ISO start time with
// its Mountain Time offset, and re-renders on a language switch.
document.addEventListener("DOMContentLoaded", () => {
  const el = document.querySelector("[data-countdown]");
  if (!el) return;
  const start = new Date(el.dataset.countdown);
  const end = new Date(el.dataset.countdownEnd || el.dataset.countdown);
  if (isNaN(start)) return;
  const t = window.t || ((key) => key);
  const out = el.querySelector("[data-countdown-text]");

  function render() {
    const now = new Date();
    if (now >= end) {
      el.hidden = true;
      return;
    }
    el.hidden = false;
    if (now >= start) {
      out.textContent = t("countdown.open");
      return;
    }
    const mins = Math.floor((start - now) / 60000);
    const days = Math.floor(mins / 1440);
    const hours = Math.floor((mins % 1440) / 60);
    out.textContent = days > 0
      ? t("countdown.days", { days, hours })
      : t("countdown.hours", { hours, mins: mins % 60 });
  }

  render();
  setInterval(render, 60000);
  window.addEventListener("lang:changed", render);
});
