import assert from "node:assert/strict";
import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const parkingRoot = path.join(projectRoot, "parking");

const locales = {
  en: {
    eyebrow: "A calmer way to master Japanese",
    title: "Small steps. Stronger Japanese.",
    lede: "built to support steady progress from N5 onward.",
    label: "In preparation",
    status: "We’re preparing the first lessons with care.",
    footer: "A free study space, made for steady progress.",
  },
  vi: {
    eyebrow: "Học tiếng Nhật theo một cách nhẹ nhàng hơn",
    title: "Từng bước nhỏ. Tiếng Nhật vững vàng hơn.",
    lede: "để tiến bộ vững vàng từ N5 trở đi.",
    label: "Đang chuẩn bị",
    status: "Chúng tôi đang cẩn thận chuẩn bị những bài học đầu tiên.",
    footer: "Một không gian học miễn phí, dành cho sự tiến bộ bền vững.",
  },
  id: {
    eyebrow: "Cara yang lebih tenang untuk menguasai bahasa Jepang",
    title: "Langkah kecil. Bahasa Jepang makin kuat.",
    lede: "agar kemajuanmu tetap konsisten mulai dari N5.",
    label: "Sedang disiapkan",
    status: "Kami sedang menyiapkan pelajaran pertama dengan saksama.",
    footer: "Ruang belajar gratis, dibuat untuk kemajuan yang konsisten.",
  },
};

const visualPages = ["index.html", "en/index.html", "vi/index.html", "id/index.html"];
const visualRatingLabels = {
  "index.html": ["Again", "Good"],
  "en/index.html": ["Again", "Good"],
  "vi/index.html": ["Lại", "Tốt"],
  "id/index.html": ["Ulangi", "Bagus"],
};

async function readParkingFile(relativePath) {
  return readFile(path.join(parkingRoot, relativePath), "utf8");
}

test("publishing artifact contains every required static file", async () => {
  const files = [
    "index.html",
    "404.html",
    "robots.txt",
    "assets/site.css",
    "assets/site.js",
    "assets/locale.js",
    "assets/favicon.png",
    "assets/og.jpg",
    ...Object.keys(locales).map((locale) => `${locale}/index.html`),
  ];

  await Promise.all(files.map((file) => access(path.join(parkingRoot, file))));
});

async function collectArtifactFiles(directory, prefix = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const relativePath = path.posix.join(prefix, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectArtifactFiles(path.join(directory, entry.name), relativePath));
    } else {
      files.push(relativePath);
    }
  }

  return files;
}

test("publishing artifact contains only allowlisted public files", async () => {
  const expectedFiles = [
    "404.html",
    "assets/favicon.png",
    "assets/locale.js",
    "assets/og.jpg",
    "assets/site.css",
    "assets/site.js",
    "en/index.html",
    "id/index.html",
    "index.html",
    "robots.txt",
    "vi/index.html",
  ].sort();

  assert.deepEqual((await collectArtifactFiles(parkingRoot)).sort(), expectedFiles);
});

for (const [locale, copy] of Object.entries(locales)) {
  test(`${locale} page has complete localized metadata and content`, async () => {
    const html = await readParkingFile(`${locale}/index.html`);

    assert.match(html, new RegExp(`<html[^>]+lang="${locale}"`));
    assert.match(html, new RegExp(`<body[^>]+data-locale="${locale}"`));
    assert.match(html, new RegExp(`<h1[^>]*>\\s*${copy.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*</h1>`));
    assert.ok(html.includes(copy.eyebrow));
    assert.ok(html.includes(copy.lede));
    assert.ok(html.includes(copy.label));
    assert.ok(html.includes(copy.status));
    assert.ok(html.includes(copy.footer));
    assert.match(html, /<meta name="description" content="[^"]+">/);
    assert.match(html, /<meta name="robots" content="noindex, follow">/);
    assert.match(html, new RegExp(`<link rel="canonical" href="https://jlptvoca\\.com/${locale}/">`));
    assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
    assert.equal((html.match(/<main\b/g) ?? []).length, 1);
  });
}

test("all localized pages provide reciprocal language links", async () => {
  for (const locale of Object.keys(locales)) {
    const html = await readParkingFile(`${locale}/index.html`);
    for (const targetLocale of Object.keys(locales)) {
      assert.match(html, new RegExp(`hreflang="${targetLocale}"`));
      assert.match(html, new RegExp(`data-locale="${targetLocale}"`));
    }
    assert.match(html, /hreflang="x-default" href="https:\/\/jlptvoca\.com\/"/);
  }
});

test("root remains useful without JavaScript and declares x-default", async () => {
  const html = await readParkingFile("index.html");

  assert.match(html, /<html[^>]+lang="en"/);
  assert.match(html, /<body[^>]+data-page="router"/);
  assert.match(html, /Small steps\. Stronger Japanese\./);
  assert.match(html, /hreflang="x-default"/);
  assert.match(html, /<script type="module" src="assets\/site\.js"><\/script>/);
});

test("decorative review visual exposes the Anki-style review sequence", async () => {
  for (const page of visualPages) {
    const html = await readParkingFile(page);
    const ratings = [...html.matchAll(/data-rating="([^"]+)"/g)].map((match) => match[1]);

    assert.match(html, /class="study-visual"[^>]*aria-hidden="true"/);
    assert.match(html, /class="[^"]*flashcard__front[^"]*"/);
    assert.match(html, /class="[^"]*flashcard__reveal[^"]*"/);
    assert.deepEqual(ratings, ["again", "good"]);
    for (const label of visualRatingLabels[page]) {
      assert.match(html, new RegExp(`class="flashcard__rating-label">${label}<`));
    }
  }
});

test("aria-hidden review decoration contains no interactive controls", async () => {
  for (const page of visualPages) {
    const html = await readParkingFile(page);
    const visual = html.match(/<section class="study-visual"[^>]*>[\s\S]*?<\/section>/)?.[0];

    assert.ok(visual);
    assert.doesNotMatch(visual, /<(a|button|input|select|textarea)\b|tabindex=/i);
  }
});

test("review decoration contains no romanization or invented lesson content", async () => {
  for (const page of visualPages) {
    const html = await readParkingFile(page);
    const visual = html.match(/<section class="study-visual"[^>]*>[\s\S]*?<\/section>/)?.[0];

    assert.ok(visual);
    assert.doesNotMatch(
      visual,
      /\b(MANABU|TSUZUKU|KOTOBA|N[1-5])\b|まなぶ|つづく|ことば|word-card__reading/i,
    );
    assert.doesNotMatch(visual, />[一二三]</);
  }
});

test("pages use restrictive metadata and no tracking or collection surfaces", async () => {
  const htmlFiles = ["index.html", "404.html", ...Object.keys(locales).map((locale) => `${locale}/index.html`)];

  for (const htmlFile of htmlFiles) {
    const html = await readParkingFile(htmlFile);
    assert.match(html, /http-equiv="Content-Security-Policy"/);
    assert.match(html, /connect-src 'none'/);
    assert.match(html, /form-action 'none'/);
    assert.match(html, /script-src 'self'/);
    assert.match(html, /style-src 'self'/);
    assert.match(html, /object-src 'none'/);
    assert.match(html, /base-uri 'none'/);
    assert.doesNotMatch(html, /unsafe-inline|unsafe-eval/);
    assert.match(html, /<meta name="referrer" content="no-referrer">/);
    assert.doesNotMatch(html, /<(form|iframe)\b/i);
    assert.doesNotMatch(html, /(google-analytics|googletagmanager|doubleclick|facebook\.net)/i);
    assert.doesNotMatch(html, /<script[^>]+src="https?:\/\//i);
    assert.doesNotMatch(html, /<link[^>]+rel="stylesheet"[^>]+href="https?:\/\//i);
  }
});

test("404 page is noindex and returns users to a language home", async () => {
  const html = await readParkingFile("404.html");

  assert.match(html, /<meta name="robots" content="noindex, nofollow">/);
  assert.match(html, /Page not found/);
  assert.match(html, /<body[^>]+data-page="router"/);
  assert.match(html, /href="\/en\/"/);
});

test("GitHub Pages workflow validates and deploys only the parking artifact", async () => {
  const workflow = await readFile(path.join(projectRoot, ".github/workflows/pages.yml"), "utf8");

  assert.match(workflow, /branches:\s*\[main\]/);
  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /npm run check/);
  assert.match(workflow, /path:\s*\.\/parking/);
  assert.match(workflow, /pages:\s*write/);
  assert.match(workflow, /id-token:\s*write/);
  assert.match(workflow, /actions\/checkout@[0-9a-f]{40} # v6/);
  assert.match(workflow, /actions\/setup-node@[0-9a-f]{40} # v6/);
  assert.match(workflow, /actions\/configure-pages@[0-9a-f]{40} # v5/);
  assert.match(workflow, /actions\/upload-pages-artifact@[0-9a-f]{40} # v4/);
  assert.match(workflow, /actions\/deploy-pages@[0-9a-f]{40} # v4/);
  assert.match(workflow, /persist-credentials:\s*false/);
  assert.match(workflow, /if: github\.ref == 'refs\/heads\/main'/);
});
