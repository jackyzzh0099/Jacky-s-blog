/**
 * Admin visual QA: logs in, screenshots the workspace pages.
 *   node scripts/qa-admin.mjs
 */
import path from "node:path";
import puppeteer from "puppeteer-core";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "http://localhost:3000";
const OUT = path.join(process.cwd(), ".qa");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--hide-scrollbars", "--disable-gpu", "--no-sandbox"],
  defaultViewport: { width: 1440, height: 1000 },
});
const page = await browser.newPage();

await page.goto(`${BASE}/admin/login`, { waitUntil: "networkidle2" });
await page.screenshot({ path: path.join(OUT, "admin-login.png") });

await page.type('input[name="email"]', "jacky@localhost");
await page.type('input[name="password"]', "jacky-blog-admin");
await Promise.all([
  page.waitForNavigation({ waitUntil: "networkidle2" }).catch(() => {}),
  page.click('button[type="submit"]'),
]);
await sleep(1500);
await page.screenshot({ path: path.join(OUT, "admin-dashboard.png") });

for (const [file, url] of [
  ["admin-posts.png", "/admin/posts"],
  ["admin-new.png", "/admin/posts/new"],
  ["admin-media.png", "/admin/media"],
  ["admin-taxonomy.png", "/admin/taxonomy"],
  ["admin-settings.png", "/admin/settings"],
  ["admin-projects.png", "/admin/projects"],
]) {
  await page.goto(`${BASE}${url}`, { waitUntil: "networkidle2" });
  await sleep(700);
  await page.screenshot({ path: path.join(OUT, file) });
}

// Open an existing article in the editor
await page.goto(`${BASE}/admin/posts`, { waitUntil: "networkidle2" });
const href = await page.evaluate(() => {
  const link = Array.from(document.querySelectorAll("tbody a")).find((a) =>
    a.getAttribute("href")?.startsWith("/admin/posts/"),
  );
  return link?.getAttribute("href") ?? null;
});
if (href) {
  await page.goto(`${BASE}${href}`, { waitUntil: "networkidle2" });
  await sleep(1400);
  await page.screenshot({ path: path.join(OUT, "admin-editor.png") });
}

console.log("admin screenshots written to .qa");
await browser.close();
