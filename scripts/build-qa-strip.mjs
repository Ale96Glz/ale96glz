import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const out = path.join(root, "assets", "logos", "qa-strip.png");

const CELL = 64;
const GAP = 24;
const INNER = 46;
const BG = { r: 22, g: 27, b: 34, alpha: 1 };

const logos = [
  { file: "karate.svg", cellW: CELL },
  { file: "gatling.svg", cellW: CELL },
  { file: "junit5.svg", cellW: CELL },
  { file: "allure.svg", cellW: CELL },
  {
    file: "rest-assured.png",
    cellW: 118,
    cropH: 30,
    innerW: 110,
    innerH: 34,
  },
  { file: "openapi.png", cellW: CELL },
  { file: "excel.svg", cellW: CELL },
];

async function toCell({ file, cropH, cellW, innerW, innerH }) {
  const input = path.join(root, "assets", "logos", file);
  let img = sharp(input);
  if (cropH) {
    const meta = await img.metadata();
    const h = Math.min(cropH, meta.height ?? cropH);
    img = img.extract({ left: 0, top: 0, width: meta.width ?? 302, height: h });
  }
  const w = innerW ?? INNER;
  const h = innerH ?? INNER;
  const inner = await img
    .resize(w, h, { fit: "contain", background: BG })
    .png()
    .toBuffer();
  const cw = cellW ?? CELL;
  return sharp({
    create: { width: cw, height: CELL, channels: 4, background: BG },
  })
    .composite([{ input: inner, gravity: "center" }])
    .png()
    .toBuffer();
}

const cells = await Promise.all(logos.map(toCell));
const width = cells.reduce((sum, _, i) => {
  const cw = logos[i].cellW ?? CELL;
  return sum + cw + (i < cells.length - 1 ? GAP : 0);
}, 0);
const height = CELL;

let left = 0;
const composites = cells.map((input, i) => {
  const pos = { input, left, top: 0 };
  left += (logos[i].cellW ?? CELL) + GAP;
  return pos;
});

await sharp({
  create: { width, height, channels: 4, background: BG },
})
  .composite(composites)
  .png()
  .toFile(out);

console.log(`Wrote ${out} (${width}x${height})`);