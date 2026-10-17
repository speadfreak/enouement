/* eslint-disable */
// One-off brand asset generator. Uses sharp to rasterize brand.svg into
// every required icon size + favicon.ico + apple-touch-icon + PWA icons +
// og-image. Run once: `bun run scripts/gen-brand.ts`
import sharp from "sharp";
import { readFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const SVG = readFileSync(resolve(process.cwd(), "public/brand.svg"));
const OUT = resolve(process.cwd(), "public");

async function png(size: number, name: string) {
  const dest = resolve(OUT, name);
  await sharp(SVG).resize(size, size, { fit: "contain" }).png().toFile(dest);
  console.log("✓", name, `${size}x${size}`);
}

async function main() {
  if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

  // Standard favicon PNGs
  await png(16, "icon-16.png");
  await png(32, "icon-32.png");
  await png(48, "icon-48.png");
  await png(96, "icon-96.png");
  await png(192, "icon-192.png");
  await png(512, "icon-512.png");

  // Maskable PWA icons (padded ~10% for safe zone)
  const pad = (size: number) => Math.round(size * 0.1);
  for (const size of [192, 512]) {
    const p = pad(size);
    await sharp(SVG)
      .resize(size - p * 2, size - p * 2, { fit: "contain" })
      .extend({ top: p, bottom: p, left: p, right: p, background: "#050A07" })
      .png()
      .toFile(resolve(OUT, `icon-maskable-${size}.png`));
    console.log("✓", `icon-maskable-${size}.png`, `${size}x${size}`);
  }

  // apple-touch-icon (180)
  await sharp(SVG)
    .resize(180, 180, { fit: "contain" })
    .extend({ top: 0, bottom: 0, left: 0, right: 0, background: "#050A07" })
    .flatten({ background: "#050A07" })
    .png()
    .toFile(resolve(OUT, "apple-touch-icon.png"));
  console.log("✓ apple-touch-icon.png 180x180");

  // favicon.png (served as favicon via metadata; browsers accept png-as-ico)
  await sharp(SVG).resize(32, 32, { fit: "contain" }).png().toFile(resolve(OUT, "favicon.png"));
  console.log("✓ favicon.png 32x32");

  // og-image 1200x630 — brand mark left + text right
  const ogOverlay = Buffer.from(
    `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1200" y2="0" gradientUnits="userSpaceOnUse">
          <stop stop-color="#FFE600"/>
          <stop offset="0.5" stop-color="#FFD60A"/>
          <stop offset="1" stop-color="#00C853"/>
        </linearGradient>
        <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
          <stop stop-color="#050A07"/>
          <stop offset="1" stop-color="#0B130E"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#bg)"/>
      <text x="720" y="300" font-family="Arial, sans-serif" font-size="86" font-weight="800" fill="url(#g)">ENOUEMENT 2K27</text>
      <text x="720" y="360" font-family="Arial, sans-serif" font-size="32" font-weight="400" fill="#8AA394">The Final Chapter — Class of 2027, Ethiopia</text>
      <text x="720" y="410" font-family="Arial, sans-serif" font-size="24" font-weight="400" fill="#5A6B5F">A cinematic memory of the senior batch</text>
    </svg>`
  );
  await sharp(ogOverlay).png().toFile(resolve(OUT, "og-image.png"));
  console.log("✓ og-image.png 1200x630");

  console.log("\n✅ All brand assets generated in /public");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
