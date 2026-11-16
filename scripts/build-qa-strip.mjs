import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const out = path.join(root, "assets", "logos", "qa-strip.png");

const CELL = 64;
const GAP = 20;
const GAP_WIDE = 32;
const INNER = 46;
const TILE = "#161b22";
const RADIUS = 12;

const logos = [
  { file: "karate.svg", cellW: CELL },
  { file: "gatling.svg", cellW: CELL },
  { file: "junit5.svg", cellW: CELL },
  { file: "allure.svg", cellW: CELL },
  {
    file: "rest-assured.png",
    cellW: 122,
    cropH: 30,
    innerW: 112,
    innerH: 32,
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

async function iconBuffer({ file, cropH, innerW, innerH }) {
  const input = path.join(root, "assets", "logos", file);
  let img = sharp(input);
  if (cropH) {
    const meta = await img.metadata();
    const h = Math.min(cropH, meta.height ?? cropH);
    img = img.extract({ left: 0, top: 0, width: meta.width ?? 302, height: h });
  }
  return img
    .resize(innerW ?? INNER, innerH ?? INNER, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

async function roundedTile(cellW, icon) {
  const svg = `<svg width="${cellW}" height="${CELL}"><rect width="${cellW}" height="${CELL}" rx="${RADIUS}" ry="${RADIUS}" fill="${TILE}"/></svg>`;
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
  tiles.reduce((sum, tile, i) => sum + (logos[i].cellW ?? CELL), 0) +
  logos.reduce((sum, _, i) => sum + gapBeforeLogo(i), 0);

const height = CELL;
let left = 0;
const composites = tiles.map((input, i) => {
  left += gapBeforeLogo(i);
  const pos = { input, left, top: 0 };
  left += logos[i].cellW ?? CELL;
  return pos;
});

await sharp({
  create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
})
  .composite(composites)
  .png()
  .toFile(out);

console.log(`Wrote ${out} (${width}x${height})`);