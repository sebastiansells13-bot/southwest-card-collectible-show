// English/Spanish toggle, same markup contract as julia-ketsaa-remax.
// Client-side only — there's no separate /es/ URL per page, so this is a
// visitor convenience, not a Spanish-language SEO strategy. The choice
// persists per visitor via localStorage ("lang").
//
//   data-i18n="key"             → text content replaced from i18n.json
//   data-i18n-placeholder="key" → `placeholder` attribute replaced
//   data-i18n-attr="aria-label:key;title:key2" → listed attributes replaced
//   data-i18n-vars='{"n":"42"}' → {name} substitutions for the keys above
//   data-i18n-date="long|readable|month" (on <time datetime>) → date
//     re-formatted in the current language
//   data-i18n-title-es="..." (on <title>) → CMS-authored Spanish page name
//   data-i18n-lang="en"|"es"    → shown only in that language; CMS content
//     with a Spanish version is rendered both ways (macros/bilingual.njk)
//
// English is what the HTML ships with and is cached on each element the
// first time it's swapped, so switching back restores it exactly.
// Relies on window.t()/window.i18nLang() from i18n-runtime.js.
(function () {
  if (typeof window.t !== "function") return;

  function vars(el) {
    if (!el.dataset.i18nVars) return undefined;
    try {
      return JSON.parse(el.dataset.i18nVars);
    } catch (err) {
      return undefined;
    }
  }

  // Mirrors the longDate / readableDate / monthShort filters in
  // eleventy.config.cjs, in the visitor's language.
  const DATE_FORMATS = {
    long: { weekday: "long", month: "long", day: "numeric", year: "numeric" },
    readable: { day: "2-digit", month: "short", year: "numeric" },
    month: { month: "short" },
  };

  function formatDate(el, lang) {
    const date = new Date(el.getAttribute("datetime"));
    if (isNaN(date)) return el.dataset.i18nEnCache;
    const opts = Object.assign({ timeZone: "UTC" }, DATE_FORMATS[el.dataset.i18nDate] || DATE_FORMATS.readable);
    const text = new Intl.DateTimeFormat(lang === "es" ? "es-MX" : "en-US", opts).format(date).replace(".", "");
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  function cache(el, name, value) {
    if (el.dataset[name] === undefined) el.dataset[name] = value;
    return el.dataset[name];
  }

  function applyTo(el, lang) {
    if (el.dataset.i18n) {
      const en = cache(el, "i18nEnCache", el.textContent);
      el.textContent = lang === "en" ? en : window.t(el.dataset.i18n, vars(el));
    }
    if (el.hasAttribute("data-i18n-date")) {
      const en = cache(el, "i18nEnCache", el.textContent);
      el.textContent = lang === "en" ? en : formatDate(el, lang);
    }
    if (el.dataset.i18nAttr) {
      el.dataset.i18nAttr.split(";").forEach(function (pair) {
        const parts = pair.split(":");
        const attr = parts[0].trim();
        const key = (parts[1] || "").trim();
        if (!attr || !key) return;
        const en = cache(el, "i18nAttrEn_" + attr.replace(/[^a-z]/gi, ""), el.getAttribute(attr) || "");
        el.setAttribute(attr, lang === "en" ? en : window.t(key, vars(el)));
      });
    }
    if (el.dataset.i18nPlaceholder) {
      const en = cache(el, "i18nPlaceholderEnCache", el.getAttribute("placeholder") || "");
      el.setAttribute("placeholder", lang === "en" ? en : window.t(el.dataset.i18nPlaceholder));
    }
    if (el.dataset.i18nTitleEs) {
      // <title> reads "Page · Southwest Card & Collectible Show" — swap only
      // the part before the first " · ".
      const en = cache(el, "i18nEnCache", el.textContent);
      const sep = en.indexOf(" · ");
      el.textContent = lang === "en" ? en : el.dataset.i18nTitleEs + (sep === -1 ? "" : en.slice(sep));
    }
  }

  function applyAll(lang) {
    document.documentElement.lang = lang;
    document
      .querySelectorAll("[data-i18n], [data-i18n-placeholder], [data-i18n-attr], [data-i18n-date], [data-i18n-title-es]")
      .forEach(function (el) {
        applyTo(el, lang);
      });
    document.querySelectorAll("[data-i18n-lang]").forEach(function (el) {
      el.hidden = el.dataset.i18nLang !== lang;
    });
    document.querySelectorAll("[data-lang-toggle]").forEach(function (btn) {
      btn.setAttribute("aria-pressed", String(btn.dataset.langToggle === lang));
    });
    document.documentElement.classList.remove("i18n-pending");
    // Lets table-picker.js re-render its status messages on a switch.
    window.dispatchEvent(new CustomEvent("lang:changed", { detail: lang }));
  }

  function setLanguage(lang) {
    try {
      localStorage.setItem("lang", lang);
    } catch (err) {
      // Private browsing / storage blocked — still apply for this page view.
    }
    applyAll(lang);
  }

  document.querySelectorAll("[data-lang-toggle]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      setLanguage(btn.dataset.langToggle);
    });
  });

  if (window.i18nLang() === "es") applyAll("es");
  else document.documentElement.classList.remove("i18n-pending");
})();
