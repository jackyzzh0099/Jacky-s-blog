/**
 * QA harness: drives the installed Chrome via puppeteer-core to capture
 * screenshots and run scripted interaction checks.
 *
 *   node scripts/qa.mjs shoot <url> <out.png> [scrollY] [theme] [height]
 *   node scripts/qa.mjs flow            # end-to-end CMS test
 */
import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = process.env.QA_BASE || "http://localhost:3000";
const OUT = path.join(process.cwd(), ".qa");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function launch() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--hide-scrollbars", "--disable-gpu", "--no-sandbox"],
    defaultViewport: { width: 1440, height: 1000, deviceScaleFactor: 1 },
  });
  return browser;
}

async function shoot() {
  const url = process.argv[3];
  const file = process.argv[4] ?? "shot.png";
  const scrollY = process.argv[5] ?? "0";
  const theme = process.argv[6] ?? "";
  const height = process.argv[7] ?? "1000";
  const browser = await launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: Number(height), deviceScaleFactor: 1 });

  const base = url.startsWith("http") ? url : `${BASE}${url}`;
  const target = `${base}${theme ? (base.includes("?") ? "&" : "?") + "theme=" + theme : ""}`;
  await page.goto(target, { waitUntil: "networkidle2", timeout: 90000 });
  await sleep(1200);

  if (Number(scrollY) > 0) {
    await page.evaluate((y) => window.scrollTo(0, y), Number(scrollY));
    await sleep(900);
  }

  fs.mkdirSync(OUT, { recursive: true });
  await page.screenshot({ path: path.join(OUT, file), fullPage: false });
  console.log("wrote", path.join(OUT, file));
  await browser.close();
}

async function flow() {
  const browser = await launch();
  const page = await browser.newPage();

  // Access-controlled deploys need the share code once to obtain a cookie.
  if (process.env.QA_SHARECODE) {
    await page.goto(`${BASE}/?sharecode=${process.env.QA_SHARECODE}`, {
      waitUntil: "networkidle2",
    });
  }
  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
  });
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));

  const results = [];
  const check = (name, pass, detail = "") => {
    results.push(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  };

  // 1. Public pages respond and contain content
  for (const [label, url, needle] of [
    ["home", "/", "Exploring the"],
    ["blog", "/blog", "All writing"],
    ["article", "/blog/memory-from-the-metal-up", "Page tables"],
    ["projects", "/projects", "Things I have built"],
    ["about", "/about", "Dossier"],
    ["archive", "/archive", "Chronology"],
    ["search", "/search", "Find something"],
  ]) {
    const res = await page.goto(`${BASE}${url}`, { waitUntil: "networkidle2" });
    const body = await page.evaluate(() => document.body.innerText);
    check(
      `route ${label}`,
      Boolean(res && res.status() < 400 && body.toLowerCase().includes(needle.toLowerCase())),
      `status ${res?.status()}`,
    );
  }

  // 2. Search palette
  await page.goto(`${BASE}/`, { waitUntil: "networkidle2" });
  await page.keyboard.down("Control");
  await page.keyboard.press("KeyK");
  await page.keyboard.up("Control");
  await sleep(400);
  const paletteOpen = await page.$('input[aria-label="Search query"]');
  check("command palette opens", Boolean(paletteOpen));
  if (paletteOpen) {
    await page.type('input[aria-label="Search query"]', "raft", { delay: 40 });
    await sleep(1200);
    const results = await page.$$eval('[role="dialog"] button[data-index]', (els) =>
      els.map((el) => el.innerText.replace(/\s+/g, " ").slice(0, 60)),
    );
    check("search returns hits", results.length > 0, results[0] ?? "none");
    await page.keyboard.press("Escape");
  }

  // 3. Login
  await page.goto(`${BASE}/admin`, { waitUntil: "networkidle2" });
  check("admin gate redirects", page.url().includes("/admin/login"), page.url());

  await page.type('input[name="email"]', "jacky@localhost");
  await page.type('input[name="password"]', "jacky-blog-admin");
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }).catch(() => {}),
    page.click('button[type="submit"]'),
  ]);
  await sleep(1500);
  check("login succeeds", page.url().endsWith("/admin"), page.url());

  // 4. Create an article through the editor
  await page.goto(`${BASE}/admin/posts/new`, { waitUntil: "networkidle2" });
  await page.type('input[aria-label="Article title"]', "QA check article", { delay: 20 });
  const textarea = await page.$("textarea.md-editor");
  if (textarea) {
    await textarea.click();
    await page.keyboard.type(
      "## Test heading\n\nThis paragraph was written by the automated QA flow. It includes `inline code` and a list:\n\n- one\n- two\n",
      { delay: 2 },
    );
  }
  await sleep(900);

  const previewHtml = await page.evaluate(() => {
    const pane = document.querySelectorAll(".prose-jb");
    return pane.length ? pane[pane.length - 1].innerHTML : "";
  });
  check("editor preview renders", previewHtml.includes("Test heading"), `${previewHtml.length} chars`);

  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const publish = buttons.find((b) => b.textContent?.trim().toLowerCase() === "publish");
    publish?.click();
  });
  await sleep(3000);
  const afterSaveUrl = page.url();
  check("publish saves article", /\/admin\/posts\/[0-9a-f-]{10,}/.test(afterSaveUrl), afterSaveUrl);

  // 5. Public article is reachable and rendered
  const slug = "qa-check-article";
  const res = await page.goto(`${BASE}/blog/${slug}`, { waitUntil: "networkidle2" });
  const bodyText = await page.evaluate(() => document.body.innerText);
  check("published article is public", Boolean(res && res.status() === 200 && bodyText.includes("Test heading")), `status ${res?.status()}`);

  // 6. Delete the QA article so the site stays clean
  await page.goto(`${BASE}/admin/posts`, { waitUntil: "networkidle2" });
  const deleted = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll("tr"));
    const row = rows.find((r) => r.innerText.includes("QA check article"));
    if (!row) return false;
    const btn = Array.from(row.querySelectorAll("button")).find((b) => b.textContent?.trim() === "Del");
    btn?.click();
    return true;
  });
  await sleep(300);
  if (deleted) {
    await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll("tr"));
      const row = rows.find((r) => r.innerText.includes("QA check article"));
      const btn = Array.from(row?.querySelectorAll("button") ?? []).find((b) => b.textContent?.trim() === "Sure?");
      btn?.click();
    });
    await sleep(2000);
  }
  const remaining = await page.evaluate(() => document.body.innerText.includes("QA check article"));
  check("delete flow removes article", deleted && !remaining);

  // 7. Theme toggle
  await page.goto(`${BASE}/`, { waitUntil: "networkidle2" });
  await page.evaluate(() => {
    document.querySelector('button[aria-label*="theme"]')?.click();
  });
  await sleep(500);
  const isLight = await page.evaluate(() => document.documentElement.classList.contains("light"));
  check("theme toggle switches to light", isLight);
  await page.evaluate(() => {
    document.querySelector('button[aria-label*="theme"]')?.click();
  });

  // 8. Mobile layout
  await page.setViewport({ width: 390, height: 844, isMobile: true });
  await page.goto(`${BASE}/`, { waitUntil: "networkidle2" });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  check("no horizontal overflow on mobile", overflow <= 1, `${overflow}px`);

  const menu = await page.$('button[aria-controls="mobile-nav"]');
  check("mobile menu button exists", Boolean(menu));
  if (menu) {
    await menu.click();
    await sleep(400);
    const navVisible = await page.$("#mobile-nav");
    check("mobile menu opens", Boolean(navVisible));
  }

  console.log("\n" + results.join("\n"));
  console.log("\nBrowser errors:", errors.length ? "\n" + errors.slice(0, 10).join("\n") : "none");

  await browser.close();
}

const mode = process.argv[2];
if (mode === "shoot") await shoot();
else if (mode === "flow") await flow();
else console.log("usage: node scripts/qa.mjs shoot|flow …");
