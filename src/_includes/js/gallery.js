// Lightbox for [data-gallery] photo grids (components/gallery.njk). The
// thumbnails are plain links to the full photo, so without this script they
// still work; with it they open in a <dialog> with previous/next and Esc.
document.addEventListener("DOMContentLoaded", () => {
  const galleries = document.querySelectorAll("[data-gallery]");
  if (!galleries.length) return;
  const t = window.t || ((key) => key);

  const dialog = document.createElement("dialog");
  dialog.className = "lightbox";
  dialog.innerHTML =
    '<img class="lightbox__img" alt="">' +
    '<p class="lightbox__caption" aria-live="polite"></p>' +
    '<button type="button" class="lightbox__btn lightbox__prev" data-label="gallery.prev">‹</button>' +
    '<button type="button" class="lightbox__btn lightbox__next" data-label="gallery.next">›</button>' +
    '<button type="button" class="lightbox__btn lightbox__close" data-label="gallery.close">×</button>';
  document.body.appendChild(dialog);
  const img = dialog.querySelector(".lightbox__img");
  const caption = dialog.querySelector(".lightbox__caption");
  let items = [];
  let index = 0;

  function show(i) {
    index = (i + items.length) % items.length;
    const thumb = items[index].querySelector("img");
    img.src = items[index].href;
    img.alt = thumb.alt;
    caption.textContent = `${thumb.alt} (${index + 1}/${items.length})`;
  }

  galleries.forEach((gallery) => {
    const links = [...gallery.querySelectorAll("[data-gallery-item]")];
    links.forEach((link, i) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        items = links;
        show(i);
        dialog.showModal();
      });
    });
  });

  dialog.querySelector(".lightbox__prev").addEventListener("click", () => show(index - 1));
  dialog.querySelector(".lightbox__next").addEventListener("click", () => show(index + 1));
  dialog.querySelector(".lightbox__close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") show(index - 1);
    if (e.key === "ArrowRight") show(index + 1);
  });
  // The dialog is built after i18n.js ran, so label its buttons here and
  // again on every language switch.
  const label = () => dialog.querySelectorAll("[data-label]").forEach((b) => b.setAttribute("aria-label", t(b.dataset.label)));
  label();
  window.addEventListener("lang:changed", label);
});
