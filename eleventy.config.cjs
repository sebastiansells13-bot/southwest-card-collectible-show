const { DateTime } = require("luxon");
const { createHash } = require("node:crypto");
const { readFileSync, existsSync } = require("node:fs");
const pluginRss = require("@11ty/eleventy-plugin-rss").default;
const pluginNavigation = require("@11ty/eleventy-navigation");
const markdownIt = require("markdown-it");
const markdownItAnchor = require("markdown-it-anchor");

const isProduction = process.env.ELEVENTY_ENV === "production";
const outputDirectory = isProduction ? "docs" : "dev";

// Content-address an asset so production caching can be immutable and
// far-future without ever serving a stale file after a deploy.
function contentHash(filePath) {
  if (!existsSync(filePath)) return "dev";
  return createHash("sha256").update(readFileSync(filePath)).digest("hex").slice(0, 12);
}

const assetFiles = {
  stylesheet: "src/_includes/css/index.css",
};
const assetPaths = {
  stylesheet: `/assets/css/index.${contentHash(assetFiles.stylesheet)}.css`,
};

module.exports = function (eleventyConfig) {
  eleventyConfig.addPlugin(pluginRss);
  eleventyConfig.addPlugin(pluginNavigation);

  eleventyConfig.setUseGitIgnore(false);
  eleventyConfig.ignores.add("**/.DS_Store");
  eleventyConfig.watchIgnores.add("**/.DS_Store");
  eleventyConfig.setDataDeepMerge(true);
  eleventyConfig.addGlobalData("assetPaths", assetPaths);

  eleventyConfig.addLayoutAlias("page", "layouts/page.njk");
  eleventyConfig.addLayoutAlias("post", "layouts/post.njk");

  eleventyConfig.addFilter("readableDate", (dateObj) =>
    DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat("dd LLL yyyy")
  );

  // https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-date-string
  eleventyConfig.addFilter("htmlDateString", (dateObj) =>
    DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat("yyyy-LL-dd")
  );

  eleventyConfig.addFilter("longDate", (dateObj) =>
    DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat("cccc, LLLL d, yyyy")
  );
  eleventyConfig.addFilter("usDate", (dateObj) =>
    DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat("LLL d, yyyy")
  );
  eleventyConfig.addFilter("monthShort", (dateObj) =>
    DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat("LLL")
  );
  eleventyConfig.addFilter("dayNum", (dateObj) =>
    DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat("d")
  );

  // Shows and trade days, soonest first. "Upcoming" includes today (in Las
  // Cruces time) so a show stays featured through show day. Event dates are
  // UTC midnight, so compare against today's date in UTC terms.
  eleventyConfig.addCollection("events", (api) =>
    api.getFilteredByGlob("src/events/*.md").sort((a, b) => a.date - b.date)
  );
  const startOfToday = () =>
    DateTime.fromISO(DateTime.now().setZone("America/Denver").toISODate(), { zone: "utc" }).toJSDate();
  eleventyConfig.addFilter("upcoming", (events) => events.filter((e) => e.date >= startOfToday()));
  eleventyConfig.addFilter("past", (events) =>
    events.filter((e) => e.date < startOfToday()).reverse()
  );

  // booking.json lists only tables that aren't open; key them by number so
  // the floor map can look each table up.
  eleventyConfig.addFilter("byTableNumber", (list) =>
    Object.fromEntries((list || []).map((t) => [String(t.number), t]))
  );

  // Structured data helpers for event pages. Hours come from the CMS as text
  // ("10 AM – 5 PM"); turn them into ISO times in Las Cruces time.
  eleventyConfig.addFilter("eventTimes", (dateObj, hours) => {
    const day = DateTime.fromJSDate(dateObj, { zone: "utc" });
    const times = [...String(hours || "").matchAll(/(\d{1,2})(?::(\d{2}))?\s*([AP])\.?M/gi)].map((m) => {
      let hour = Number(m[1]) % 12;
      if (m[3].toUpperCase() === "P") hour += 12;
      return DateTime.fromObject(
        { year: day.year, month: day.month, day: day.day, hour, minute: Number(m[2] || 0) },
        { zone: "America/Denver" }
      ).toISO({ suppressMilliseconds: true });
    });
    return { start: times[0] || day.toISODate(), end: times[1] || times[0] || day.toISODate() };
  });

  // "680 E University Ave, Las Cruces, NM 88001" → schema.org PostalAddress parts
  eleventyConfig.addFilter("addressParts", (address) => {
    const parts = String(address || "").split(",").map((p) => p.trim());
    const [region, postalCode] = (parts[2] || "NM").split(/\s+/);
    return {
      "@type": "PostalAddress",
      streetAddress: parts[0] || "",
      addressLocality: parts[1] || "Las Cruces",
      addressRegion: region,
      ...(postalCode ? { postalCode } : {}),
      addressCountry: "US",
    };
  });

  // Links typed into the CMS (social, payment, maps, sponsors) only render if
  // they're http(s)/mailto/tel or a site path, so a pasted "javascript:" or
  // "data:" URL can never become a clickable script. Anything else → "#".
  eleventyConfig.addFilter("safeUrl", (url, { httpsOnly = false } = {}) => {
    const value = String(url || "").trim();
    if (!value) return "";
    if (/^\/(?!\/)/.test(value)) return httpsOnly ? "" : value;
    const allowed = httpsOnly ? /^https:\/\//i : /^(https?:\/\/|mailto:|tel:)/i;
    return allowed.test(value) ? value : httpsOnly ? "" : "#";
  });

  eleventyConfig.addFilter("urlOrigin", (url) => {
    try {
      return url ? new URL(url).origin : "";
    } catch {
      return "";
    }
  });

  // JSON for an inline <script> data block (JSON-LD, the i18n dictionary);
  // escaping "<" keeps CMS text from ever closing the script tag.
  eleventyConfig.addFilter("jsonld", (obj) => JSON.stringify(obj).replace(/</g, "\\u003c"));

  eleventyConfig.addFilter("isoDate", (dateObj) =>
    DateTime.fromJSDate(dateObj, { zone: "utc" }).toISODate()
  );

  eleventyConfig.addFilter("head", (array, n) => {
    if (n < 0) return array.slice(n);
    return array.slice(0, n);
  });

  eleventyConfig.addFilter("slugify", (str) => {
    if (!str) return "";
    return str
      .toLowerCase()
      .replace(/['’]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  });

  // During `npm start`, serve source images directly instead of copying
  // them into `dev/` on every rebuild. Production media is optimized by
  // the CI pipeline (scripts/optimize-media.mjs) after Eleventy runs.
  eleventyConfig.setServerPassthroughCopyBehavior("passthrough");
  eleventyConfig.addPassthroughCopy({ "src/_includes/img": "img" });
  eleventyConfig.addPassthroughCopy({
    [assetFiles.stylesheet]: assetPaths.stylesheet.slice(1),
  });
  eleventyConfig.addPassthroughCopy({ "src/_includes/favicons": "favicons" });
  eleventyConfig.addPassthroughCopy({ "src/_includes/js": "js" });
  
  eleventyConfig.addPassthroughCopy(".nojekyll");

  let markdownLibrary = markdownIt({
    html: true,
    breaks: true,
    linkify: true,
  }).use(markdownItAnchor, {
    permalink: markdownItAnchor.permalink.headerLink({ class: "direct-link", symbol: "#" }),
  });
  eleventyConfig.setLibrary("md", markdownLibrary);

  eleventyConfig.addShortcode("year", () => `${new Date().getFullYear()}`);

  return {
    templateFormats: ["md", "njk", "html", "liquid"],
    // GitHub Pages project URL; set back to "/" once a custom domain is pointed here.
    pathPrefix: "/southwest-card-collectible-show/",
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk",
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: outputDirectory,
    },
  };
};
