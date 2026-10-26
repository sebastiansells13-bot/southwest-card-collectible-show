// Shared translation helpers (window.t / window.i18nLang), same as the
// julia-ketsaa-remax toggle. Scripts that build their own messages at
// runtime (table-picker.js) call these, so this must load before them —
// see base.njk. The dictionary is src/_data/i18n.json, inlined by base.njk
// as the #i18n-data JSON island.
(function () {
  let dict = {};
  const dataEl = document.getElementById("i18n-data");
  if (dataEl) {
    try {
      dict = JSON.parse(dataEl.textContent);
    } catch (err) {
      dict = {};
    }
  }

  function i18nLang() {
    try {
      return localStorage.getItem("lang") === "es" ? "es" : "en";
    } catch (err) {
      return "en";
    }
  }

  // t("picker.selected", {count: 2}) looks up the key in the current
  // language (falling back to English, then to the key itself) and fills
  // any {name}-style placeholders.
  function t(key, vars) {
    const entry = dict[key];
    let text = entry ? entry[i18nLang()] || entry.en || key : key;
    if (vars) {
      Object.keys(vars).forEach(function (name) {
        text = text.split("{" + name + "}").join(vars[name]);
      });
    }
    return text;
  }

  window.i18nLang = i18nLang;
  window.t = t;
})();
