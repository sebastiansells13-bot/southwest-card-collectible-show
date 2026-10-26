// Table layout for the Las Cruces Convention Center floor, traced from the
// October 2026 vendor map. Positions are in floor units (the map's viewBox);
// the template turns them into percentages so the map scales with the page.
// Which tables are taken lives in booking.json (CMS), not here.
const COL = 64; // distance between table centers along a row
const X0 = 150; // left edge of column 0
const TABLE_W = 58;
const TABLE_H = 30;

const width = 1240;
const height = 580;

// Each run is a straight line of consecutively numbered tables.
// `col` is the starting column; `step` lets a run skip columns.
const runs = [
  // Back wall (120–126, then 127–132 past the blocked section)
  { from: 120, to: 126, col: 1, y: 30 },
  { from: 127, to: 132, col: 9.6, y: 30, step: 0.9 },
  // Four double-sided rows, back to front
  { from: 105, to: 119, col: 0, y: 100 },
  { from: 91, to: 104, col: 1, y: 132 },
  { from: 76, to: 90, col: 0, y: 212 },
  { from: 61, to: 75, col: 0, y: 244 },
  { from: 46, to: 60, col: 0, y: 324 },
  { from: 31, to: 45, col: 0, y: 356 },
  { from: 16, to: 30, col: 0, y: 436 },
  { from: 1, to: 15, col: 0, y: 468 },
];

const tables = [];
for (const run of runs) {
  const step = run.step || 1;
  for (let n = run.from; n <= run.to; n++) {
    const col = run.col + (n - run.from) * step;
    tables.push({ n, x: X0 + col * COL, y: run.y, w: TABLE_W, h: TABLE_H });
  }
}

// Right wall, 133 (back) to 141 (front), tables turned sideways
for (let n = 133; n <= 141; n++) {
  tables.push({ n, x: width - 72, y: 86 + (n - 133) * 46, w: TABLE_H + 6, h: 42 });
}

tables.sort((a, b) => a.n - b.n);

const landmarks = [
  { label: "Food / Bar", x: 10, y: 20, w: 110, h: 150 },
  { label: "Rest Area", x: 10, y: 190, w: 110, h: 270 },
  { label: "Not for sale", x: X0 + 8 * COL, y: 30, w: 1.5 * COL - 6, h: TABLE_H, muted: true },
  { label: "Entrance", x: X0 + 5 * COL, y: 528, w: 5 * COL, h: 36, entrance: true },
];

export default {
  width,
  height,
  tables,
  landmarks,
  pct: (v, total) => ((v / total) * 100).toFixed(3) + "%",
};
