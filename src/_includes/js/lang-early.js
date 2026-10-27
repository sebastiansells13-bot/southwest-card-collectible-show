// Loaded in <head> without defer: hides the page until i18n.js has swapped
// in Spanish, so a returning Spanish visitor never sees an English flash.
// i18n.js removes the class; the timeout is a safety net if it fails to load.
// A file rather than an inline script so the CSP can stay script-src 'self'.
try {
  if (localStorage.getItem("lang") === "es") {
    document.documentElement.classList.add("i18n-pending");
    setTimeout(function () {
      document.documentElement.classList.remove("i18n-pending");
    }, 1500);
  }
} catch (e) {}
