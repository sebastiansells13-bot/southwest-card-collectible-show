// Search and specialty filter for /vendors/directory/ (vendor-directory.njk).
document.addEventListener("DOMContentLoaded", () => {
  const list = document.getElementById("directory");
  if (!list) return;
  const items = [...list.querySelectorAll(".directory__item")];
  const search = document.getElementById("directory-search");
  const chips = [...document.querySelectorAll(".directory-filters .chip")];
  const empty = document.getElementById("directory-empty");
  let specialty = "";

  function apply() {
    const q = search.value.trim().toLowerCase();
    let shown = 0;
    items.forEach((li) => {
      const match = (!q || li.dataset.name.includes(q)) && (!specialty || li.dataset.specialty === specialty);
      li.hidden = !match;
      if (match) shown++;
    });
    empty.hidden = shown > 0;
  }

  search.addEventListener("input", apply);
  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      specialty = chip.dataset.filter;
      chips.forEach((c) => {
        c.classList.toggle("is-active", c === chip);
        c.setAttribute("aria-pressed", String(c === chip));
      });
      apply();
    });
  });
});
