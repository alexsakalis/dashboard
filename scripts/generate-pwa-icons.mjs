import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const iconsDir = path.join(root, "public", "icons");
const sourceSvg = path.join(iconsDir, "icon.svg");

const outputs = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "apple-touch-icon.png", size: 180 },
];

async function generateIcons() {
  await mkdir(iconsDir, { recursive: true });

  for (const { name, size } of outputs) {
    await sharp(sourceSvg)
      .resize(size, size)
      .png()
      .toFile(path.join(iconsDir, name));
    console.log(`Generated ${name} (${size}x${size})`);
  }

  const favicon32 = await sharp(sourceSvg).resize(32, 32).png().toBuffer();
  const favicon16 = await sharp(sourceSvg).resize(16, 16).png().toBuffer();

  const { default: pngToIco } = await import("png-to-ico");
  const faviconIco = await pngToIco([favicon16, favicon32]);
  await writeFile(path.join(root, "public", "favicon.ico"), faviconIco);
  await sharp(favicon32).toFile(path.join(root, "public", "favicon.png"));

  console.log("Generated favicon.ico and favicon.png");
}

generateIcons().catch((error) => {
  console.error(error);
  process.exit(1);
});
