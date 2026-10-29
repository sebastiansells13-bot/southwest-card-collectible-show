// Simple inquiry forms ([data-inquiry-form], e.g. components/sponsor-form.njk).
// Sends to data-endpoint like table-picker.js does: a request only counts as
// sent when FormSubmit's JSON says success, otherwise (or with no endpoint)
// the visitor gets a copy-and-DM summary instead.
document.addEventListener("DOMContentLoaded", () => {
  const t = window.t || ((key) => key);

  document.querySelectorAll("[data-inquiry-form]").forEach((form) => {
    const done = form.nextElementSibling;
    const err = form.querySelector("[data-form-error]");
    const submit = form.querySelector('[type="submit"]');
    let errKey = null;

    function showError(key) {
      errKey = key;
      err.textContent = key ? t(key) : "";
      err.hidden = !key;
    }
    window.addEventListener("lang:changed", () => { if (errKey) showError(errKey); });

    // The summary goes to the organizers, so it stays in English.
    function summary(data) {
      let text = `${form.dataset.summaryTitle || "INQUIRY"}\n`;
      for (const [key, value] of data.entries()) {
        if (key.startsWith("_") || key === "language" || !String(value).trim()) continue;
        text += `${key.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase())}: ${value}\n`;
      }
      if (data.get("language") === "es") text += "Language: Spanish\n";
      return text;
    }

    function finish(sent, data) {
      form.hidden = true;
      done.hidden = false;
      done.querySelector(sent ? "[data-form-sent]" : "[data-form-manual]").hidden = false;
      if (!sent) done.querySelector("[data-form-summary]").value = summary(data);
      done.focus();
    }

    done.querySelector("[data-form-copy]").addEventListener("click", async (e) => {
      const area = done.querySelector("[data-form-summary]");
      try { await navigator.clipboard.writeText(area.value); } catch { area.select(); document.execCommand("copy"); }
      e.target.textContent = t("done.copied");
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const missing = [...form.querySelectorAll("[required]")].filter((f) => !f.value.trim() || !f.checkValidity());
      if (missing.length) {
        showError("sponsorForm.needContact");
        missing[0].focus();
        return;
      }
      showError(null);
      form.elements.language.value = window.i18nLang ? window.i18nLang() : "en";
      const data = new FormData(form);
      if (!form.dataset.endpoint) return finish(false, data);
      if (submit.disabled) return;
      submit.disabled = true;
      try {
        const res = await fetch(form.dataset.endpoint, { method: "POST", body: data, headers: { Accept: "application/json" } });
        const body = await res.json().catch(() => ({}));
        if (!res.ok || String(body.success) !== "true") throw new Error(body.message || res.status);
        finish(true, data);
      } catch {
        finish(false, data);
      } finally {
        submit.disabled = false;
      }
    });
  });
});
