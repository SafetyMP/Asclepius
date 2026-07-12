/**
 * Capture README screenshots and demo GIF from the Asclepius clinical console.
 *
 * Usage:
 *   cd web && npm ci && npm run build && npm run start
 *   npm run screenshots
 *
 * Rebuild GIF only from existing PNGs (no browser):
 *   npm run screenshots:rebuild-gif
 *
 * Optional: SCREENSHOT_BASE_URL=http://localhost:3200 npm run screenshots
 *
 * CI: set CI=1 to use bundled Chromium instead of system Chrome.
 */
import { chromium } from "playwright";
import gifenc from "gifenc";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";

const { GIFEncoder, quantize, applyPalette } = gifenc;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..", "..");
const outDir = path.join(repoRoot, "docs", "assets");
const baseUrl = process.env.SCREENSHOT_BASE_URL ?? "http://localhost:3200";

const pages = [
  { path: "/", file: "overview.png", name: "Overview", heading: "Asclepius FHIR console" },
  { path: "/patients", file: "patients.png", name: "Patients", heading: "Patients" },
  {
    path: "/interactions",
    file: "interactions.png",
    name: "Drug interactions",
    heading: "Drug interaction check",
  },
  {
    path: "/cds",
    file: "cds.png",
    name: "Clinical decision support",
    heading: "Clinical decision support",
  },
  { path: "/validate", file: "validate.png", name: "Validate resource", heading: "Validate resource" },
];

const gifFrameFiles = ["overview.png", "patients.png", "interactions.png", "cds.png"];

const GIF_FRAME_DELAY_MS = 2_000;

function launchOptions() {
  if (process.env.CI) {
    return { headless: true };
  }
  return { channel: "chrome", headless: true };
}

async function writeDemoGif(frames) {
  const encoder = GIFEncoder();
  for (const { buffer, name } of frames) {
    const { data, width, height } = PNG.sync.read(buffer);
    const palette = quantize(data, 256);
    const index = applyPalette(data, palette);
    encoder.writeFrame(index, width, height, { palette, delay: GIF_FRAME_DELAY_MS });
    console.log(`GIF frame: ${name}`);
  }
  encoder.finish();
  const gifPath = path.join(outDir, "demo.gif");
  await writeFile(gifPath, Buffer.from(encoder.bytes()));
  console.log("Captured demo GIF -> docs/assets/demo.gif");
}

async function rebuildGifFromExisting() {
  await mkdir(outDir, { recursive: true });
  const frames = [];
  for (const file of gifFrameFiles) {
    const pageMeta = pages.find((entry) => entry.file === file);
    const name = pageMeta?.name ?? file;
    const buffer = await readFile(path.join(outDir, file));
    frames.push({ buffer, name });
    console.log(`Loaded ${name} -> docs/assets/${file}`);
  }
  await writeDemoGif(frames);
}

async function captureLive() {
  await mkdir(outDir, { recursive: true });

  const browser = await chromium.launch(launchOptions());
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  await context.addInitScript(() => {
    localStorage.setItem("theme", "light");
  });
  const page = await context.newPage();

  const gifFrames = [];

  for (const { path: route, file, name, heading } of pages) {
    await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
    await page.getByRole("heading", { name: heading }).waitFor({ state: "visible", timeout: 30_000 });
    await page.waitForTimeout(600);
    const buffer = await page.screenshot({ fullPage: false });
    const dest = path.join(outDir, file);
    await writeFile(dest, buffer);
    console.log(`Captured ${name} -> docs/assets/${file}`);
    if (gifFrameFiles.includes(file)) {
      gifFrames.push({ buffer, name });
    }
  }

  await writeDemoGif(gifFrames);
  await browser.close();
}

async function main() {
  if (process.argv.includes("--from-existing")) {
    await rebuildGifFromExisting();
    return;
  }
  await captureLive();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
