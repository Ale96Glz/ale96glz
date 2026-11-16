import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const out = path.join(root, "assets", "logos", "qa-strip.png");

// 2x para que GitHub lo muestre nitido en pantallas retina (width="650" en el README).
const SCALE = 2;
const CELL = 64;
const GAP = 20;
const GAP_WIDE = 32;
const INNER = 42;
// Fondo claro: los logos de Karate, Excel, JUnit, OpenAPI y REST Assured son oscuros.
const TILE = "#ffffff";
const BORDER = "#d0d7de";
const RADIUS = 12;

const logos = [
  { file: "karate.svg", cellW: CELL },
  { file: "gatling.svg", cellW: CELL },
  { file: "junit5.svg", cellW: CELL },
  { file: "allure.svg", cellW: CELL },
  {
    file: "rest-assured.png",
    cellW: 122,
    innerW: 104,
    innerH: 34,
    trim: "#ffffff",
    gapAfter: GAP_WIDE,
    gapBefore: GAP_WIDE,
  },
  { file: "openapi.png", cellW: CELL },
  { file: "excel.svg", cellW: CELL },
];

function gapBeforeLogo(i) {
  if (i === 0) return 0;
  const prevWide = logos[i - 1].gapAfter;
  const thisWide = logos[i].gapBefore;
  return Math.max(GAP, prevWide ?? 0, thisWide ?? 0);
}

async function iconBuffer({ file, trim, innerW, innerH }) {
  const input = path.join(root, "assets", "logos", file);
  let img = sharp(input);
  if (trim) img = img.trim({ background: trim });
  return img
    .resize((innerW ?? INNER) * SCALE, (innerH ?? INNER) * SCALE, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

async function roundedTile(cellW, icon) {
  const w = cellW * SCALE;
  const h = CELL * SCALE;
  const svg =
    `<svg width="${w}" height="${h}">` +
    `<rect x="${SCALE / 2}" y="${SCALE / 2}" width="${w - SCALE}" height="${h - SCALE}" ` +
    `rx="${RADIUS * SCALE}" ry="${RADIUS * SCALE}" fill="${TILE}" stroke="${BORDER}" stroke-width="${SCALE}"/>` +
    `</svg>`;
  const base = await sharp(Buffer.from(svg)).png().toBuffer();
  return sharp(base)
    .composite([{ input: icon, gravity: "center" }])
    .png()
    .toBuffer();
}

const tiles = await Promise.all(
  logos.map(async (logo) => {
    const icon = await iconBuffer(logo);
    return roundedTile(logo.cellW ?? CELL, icon);
  }),
);

const width =
  (tiles.reduce((sum, tile, i) => sum + (logos[i].cellW ?? CELL), 0) +
    logos.reduce((sum, _, i) => sum + gapBeforeLogo(i), 0)) *
  SCALE;

const height = CELL * SCALE;
let left = 0;
const composites = tiles.map((input, i) => {
  left += gapBeforeLogo(i) * SCALE;
  const pos = { input, left, top: 0 };
  left += (logos[i].cellW ?? CELL) * SCALE;
  return pos;
});

await sharp({
  create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
})
  .composite(composites)
  .png()
  .toFile(out);

console.log(`Wrote ${out} (${width}x${height}, display ${width / SCALE}x${height / SCALE})`);
