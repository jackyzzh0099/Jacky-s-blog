/**
 * Upload pipeline checks: PNG upload, SVG sanitisation, media serving headers,
 * and deletion. Run against the dev server with `node scripts/qa-upload.mjs`.
 */
import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "http://localhost:3000";
const TMP = path.join(process.cwd(), ".qa");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 8x8 solid PNG
const PNG_B64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAFUlEQVR42mNkYPhfz0AEYBxVSF+FABJADveWkH6oAAAAAElFTkSuQmCC";
const MALICIOUS_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80" onload="alert(1)">
  <script>fetch('/admin')</script>
  <foreignObject width="10" height="10"><div xmlns="http://www.w3.org/1999/xhtml">x</div></foreignObject>
  <rect width="120" height="80" fill="#0b0d12"/>
  <circle cx="60" cy="40" r="24" fill="none" stroke="#7E8EFF" stroke-width="2"/>
  <a href="javascript:alert(2)"><text x="10" y="70" fill="#fff" font-size="9">QA</text></a>
</svg>`;

fs.mkdirSync(TMP, { recursive: true });
const pngPath = path.join(TMP, "qa-upload.png");
const svgPath = path.join(TMP, "qa-upload.svg");
fs.writeFileSync(pngPath, Buffer.from(PNG_B64, "base64"));
fs.writeFileSync(svgPath, MALICIOUS_SVG, "utf8");

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--no-sandbox"],
  defaultViewport: { width: 1440, height: 1000 },
});
const page = await browser.newPage();
const results = [];
const check = (name, pass, detail = "") =>
  results.push(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);

const responses = [];
page.on("response", (res) => responses.push(res));

await page.goto(`${BASE}/admin/login`, { waitUntil: "networkidle2" });
await page.type('input[name="email"]', "jacky@localhost");
await page.type('input[name="password"]', "jacky-blog-admin");
await Promise.all([
  page.waitForNavigation({ waitUntil: "networkidle2" }).catch(() => {}),
  page.click('button[type="submit"]'),
]);

await page.goto(`${BASE}/admin/media`, { waitUntil: "networkidle2" });
const input = await page.$('input[type="file"]');
await input.uploadFile(pngPath, svgPath);
await sleep(3500);

const cards = await page.$$eval("img", (imgs) => imgs.map((img) => img.getAttribute("src")));
const mediaUrls = cards.filter((src) => src && src.startsWith("/api/media/"));
check("two uploads appear in library", mediaUrls.length >= 2, `${mediaUrls.length} media urls`);
check("png served from /api/media", mediaUrls.some((u) => u.endsWith(".png")));
check("svg served from /api/media", mediaUrls.some((u) => u.endsWith(".svg")));

const pngUrl = mediaUrls.find((u) => u.endsWith(".png"));
const svgUrl = mediaUrls.find((u) => u.endsWith(".svg"));

if (pngUrl) {
  const res = await page.goto(`${BASE}${pngUrl}`);
  const headers = res.headers();
  check("png content-type", headers["content-type"] === "image/png", headers["content-type"]);
  check("nosniff header", headers["x-content-type-options"] === "nosniff");
  check("immutable cache header", (headers["cache-control"] ?? "").includes("immutable"));
}

if (svgUrl) {
  const res = await page.goto(`${BASE}${svgUrl}`);
  const body = await res.text();
  const headers = res.headers();
  check("svg sanitised: no script tag", !/<script/i.test(body));
  check("svg sanitised: no onload handler", !/onload=/i.test(body));
  check("svg sanitised: no javascript: url", !/javascript:/i.test(body));
  check("svg sanitised: no foreignObject", !/<foreignObject/i.test(body));
  check("svg serves CSP sandbox", (headers["content-security-policy"] ?? "").includes("default-src 'none'"));
  check("svg keeps artwork", /<circle/i.test(body));
}

// 2. Reject a non-image with an image extension
const fakePath = path.join(TMP, "qa-fake.png");
fs.writeFileSync(fakePath, "<?php echo 1; ?>");
await page.goto(`${BASE}/admin/media`, { waitUntil: "networkidle2" });
const input2 = await page.$('input[type="file"]');
await input2.uploadFile(fakePath);
await sleep(2500);
const errorText = await page.evaluate(() => document.body.innerText);
check(
  "rejects mislabelled file",
  /does not match|Unsupported file type|could not be uploaded/i.test(errorText),
);

// 3. Delete the uploaded media through the UI
await page.goto(`${BASE}/admin/media`, { waitUntil: "networkidle2" });
const deleted = await page.evaluate(() => {
  const button = document.querySelector('button[aria-label="Delete"]');
  button?.click();
  return Boolean(button);
});
await sleep(2500);
const afterDelete = await page.evaluate(() =>
  Array.from(document.querySelectorAll("img")).filter((img) =>
    (img.getAttribute("src") ?? "").startsWith("/api/media/"),
  ).length,
);
check("delete removes one file", deleted && afterDelete < mediaUrls.length, `${afterDelete} remain`);

console.log(results.join("\n"));
console.log("\nFailed requests:", responses.filter((r) => r.status() >= 400).map((r) => `${r.status()} ${r.url()}`).slice(0, 5));

await browser.close();
