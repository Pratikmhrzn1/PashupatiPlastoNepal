/**
 * One-time image optimization: converts public/ source images into
 * AVIF/WebP (+ compressed PNG fallback) in public/images/.
 * Run: node scripts/optimize-images.mjs
 * Requires: npm i -D sharp (already a devDependency)
 */
import sharp from "sharp";
import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const PUB = path.join(ROOT, "public");
const OUT = path.join(PUB, "images");

const AVIF_QUALITY = 50;
const WEBP_QUALITY = 75;

async function ensureOut() {
  await mkdir(OUT, { recursive: true });
}

/** hero.png: 1024×1536, 1.75 MB → responsive AVIF/WebP + compressed PNG fallback. */
async function hero() {
  const src = path.join(PUB, "hero.png");
  const base = sharp(src);
  const { width, height } = await base.metadata();
  console.log(`hero: source ${width}x${height}`);

  const widths = [640, 1024];
  for (const w of widths) {
    const h = Math.round((height / width) * w);
    await base
      .clone()
      .resize(w, h)
      .avif({ quality: AVIF_QUALITY })
      .toFile(path.join(OUT, `hero-${w}.avif`));
    await base
      .clone()
      .resize(w, h)
      .webp({ quality: WEBP_QUALITY })
      .toFile(path.join(OUT, `hero-${w}.webp`));
  }
  // PNG fallback (for the <picture> final source) — heavily compressed.
  await base.png({ compressionLevel: 9, quality: 70, palette: true }).toFile(path.join(OUT, "hero.png"));
  console.log("hero: done");
}

/** logo.png: 1254×1254, 1.35 MB → small webp/png icons. */
async function logo() {
  const src = path.join(PUB, "logo.png");
  const base = sharp(src);

  for (const size of [64, 128, 512]) {
    await base.clone().resize(size, size).webp({ quality: 85 }).toFile(path.join(OUT, `logo-${size}.webp`));
    await base.clone().resize(size, size).png({ compressionLevel: 9, palette: true }).toFile(path.join(OUT, `logo-${size}.png`));
  }
  console.log("logo: done");
}

/** member photo: jpg → webp. */
async function member() {
  const src = path.join(PUB, "machababumaharjan.jpg");
  await sharp(src).webp({ quality: 80 }).toFile(path.join(OUT, "member.webp"));
  await sharp(src).avif({ quality: AVIF_QUALITY }).toFile(path.join(OUT, "member.avif"));
  console.log("member: done");
}

/**
 * Product photos (public/products) → optimized WebP siblings.
 * The originals stay as the editable sources; the app always loads the .webp
 * (universally supported, ~3x smaller than the source JPEGs).
 */
async function featuredProducts() {
  const dir = path.join(PUB, "products");
  const files = await readdir(dir);
  const baseOf = (f) => f.replace(/\.[^.]+$/, "");

  // Sources are the editable originals (jpeg/png/avif). Existing .webp files are
  // treated as final assets and skipped, so re-runs never re-encode in place
  // and never compound quality loss.
  const sources = files.filter((f) => /\.(jpe?g|png|avif)$/i.test(f));

  for (const file of sources) {
    const src = path.join(dir, file);
    const out = path.join(dir, `${baseOf(file)}.webp`);
    // Cards render at ~330px CSS width, so 800px max covers 2x DPR.
    await sharp(src)
      .resize({ width: 800, height: 800, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(out);
    console.log(`products: ${file} → ${path.basename(out)}`);
  }
  console.log("products: done");
}

await ensureOut();
await Promise.all([hero(), logo(), member(), featuredProducts()]);
console.log("All images optimized into public/images/");
