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
const hreflangCluster = [
  ["x-default", "https://jlptvoca.com/"],
  ["en", "https://jlptvoca.com/en/"],
  ["vi", "https://jlptvoca.com/vi/"],
  ["id", "https://jlptvoca.com/id/"],
];
const seoPages = {
  "index.html": {
    url: "https://jlptvoca.com/",
    title: "Japanese Vocabulary Study — Choose Your Language | JLPT VOCA",
    description: "Choose English, Vietnamese, or Indonesian for JLPT VOCA, a free Japanese vocabulary study space for focused practice and smarter review. Coming soon.",
    ogLocale: "en_US",
    imageAlt: "JLPT VOCA Japanese vocabulary flashcard preview",
  },
  "en/index.html": {
    url: "https://jlptvoca.com/en/",
    title: "JLPT Vocabulary Study and Review — Coming Soon | JLPT VOCA",
    description: "JLPT VOCA is preparing a free Japanese vocabulary study space for focused JLPT practice and smarter review. Coming soon.",
    ogLocale: "en_US",
    imageAlt: "JLPT VOCA Japanese vocabulary flashcard preview",
  },
  "vi/index.html": {
    url: "https://jlptvoca.com/vi/",
    title: "Học từ vựng JLPT — Sắp ra mắt | JLPT VOCA",
    description: "JLPT VOCA đang chuẩn bị một không gian học từ vựng tiếng Nhật miễn phí, giúp bạn luyện thi JLPT tập trung và ôn tập thông minh hơn.",
    ogLocale: "vi_VN",
    imageAlt: "Bản xem trước thẻ từ vựng tiếng Nhật JLPT VOCA",
  },
  "id/index.html": {
    url: "https://jlptvoca.com/id/",
    title: "Belajar Kosakata JLPT — Segera Hadir | JLPT VOCA",
    description: "JLPT VOCA sedang menyiapkan ruang belajar kosakata bahasa Jepang gratis untuk latihan JLPT yang terarah dan pengulangan yang lebih cerdas.",
    ogLocale: "id_ID",
    imageAlt: "Pratinjau kartu kosakata bahasa Jepang JLPT VOCA",
  },
};

async function readParkingFile(relativePath) {
  return readFile(path.join(parkingRoot, relativePath), "utf8");
}

function metaContent(html, attribute, value) {
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = html.match(new RegExp(`<meta\\s+${attribute}="${escaped}"\\s+content="([^"]*)">`));
  assert.ok(match, `missing ${attribute}=${value}`);
  return match[1];
}

function robotsTokens(html) {
  return new Set(metaContent(html, "name", "robots").split(",").map((value) => value.trim().toLowerCase()));
}

test("publishing artifact contains every required static file", async () => {
  const files = [
    "index.html",
    "404.html",
    "robots.txt",
    "sitemap.xml",
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
    "sitemap.xml",
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
    const robots = robotsTokens(html);
    assert.ok(robots.has("index"));
    assert.ok(robots.has("follow"));
    assert.ok(!robots.has("noindex"));
    assert.ok(!robots.has("nofollow"));
    assert.match(html, new RegExp(`<link rel="canonical" href="https://jlptvoca\\.com/${locale}/">`));
    assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
    assert.equal((html.match(/<main\b/g) ?? []).length, 1);
  });
}

test("all public pages provide the same reciprocal hreflang cluster", async () => {
  for (const page of Object.keys(seoPages)) {
    const html = await readParkingFile(page);
    const actual = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g)]
      .map(([, language, href]) => [language, href]);

    assert.deepEqual(actual, hreflangCluster);
  }
});

test("root is an indexable x-default language gateway without an automatic redirect", async () => {
  const html = await readParkingFile("index.html");
  const robots = robotsTokens(html);

  assert.match(html, /<html[^>]+lang="en"/);
  assert.match(html, /<body[^>]+data-page="gateway"/);
  assert.match(html, /Japanese vocabulary study, in your language\./);
  assert.ok(robots.has("index"));
  assert.ok(!robots.has("noindex"));
  assert.doesNotMatch(html, /aria-current="page"[^>]*>English/);
  assert.match(html, /id="language-recommendation"[^>]*>Recommended based on your browser language</);
  assert.match(html, /<script type="module" src="assets\/site\.js"><\/script>/);
});

test("public pages are self-canonical and expose stable favicon metadata", async () => {
  for (const [page, seo] of Object.entries(seoPages)) {
    const html = await readParkingFile(page);
    const canonicals = [...html.matchAll(/<link rel="canonical" href="([^"]+)">/g)].map(([, url]) => url);

    assert.deepEqual(canonicals, [seo.url]);
    assert.match(html, /<link rel="icon" type="image\/png" sizes="128x128" href="\/assets\/favicon\.png">/);
  }
});

test("share metadata is complete, absolute, and localized", async () => {
  const ogLocales = [...new Set(Object.values(seoPages).map(({ ogLocale }) => ogLocale))];

  for (const [page, seo] of Object.entries(seoPages)) {
    const html = await readParkingFile(page);
    const alternates = [...html.matchAll(/<meta property="og:locale:alternate" content="([^"]+)">/g)]
      .map(([, locale]) => locale)
      .sort();

    assert.equal(html.match(/<title>([^<]+)<\/title>/)?.[1], seo.title);
    assert.equal(metaContent(html, "name", "description"), seo.description);
    assert.equal(metaContent(html, "property", "og:type"), "website");
    assert.equal(metaContent(html, "property", "og:site_name"), "JLPT VOCA");
    assert.equal(metaContent(html, "property", "og:title"), seo.title);
    assert.equal(metaContent(html, "property", "og:description"), seo.description);
    assert.equal(metaContent(html, "property", "og:url"), seo.url);
    assert.equal(metaContent(html, "property", "og:locale"), seo.ogLocale);
    assert.deepEqual(alternates, ogLocales.filter((locale) => locale !== seo.ogLocale).sort());
    assert.equal(metaContent(html, "property", "og:image"), "https://jlptvoca.com/assets/og.jpg");
    assert.equal(metaContent(html, "property", "og:image:type"), "image/jpeg");
    assert.equal(metaContent(html, "property", "og:image:width"), "1200");
    assert.equal(metaContent(html, "property", "og:image:height"), "630");
    assert.equal(metaContent(html, "property", "og:image:alt"), seo.imageAlt);
    assert.equal(metaContent(html, "name", "twitter:card"), "summary_large_image");
    assert.equal(metaContent(html, "name", "twitter:title"), seo.title);
    assert.equal(metaContent(html, "name", "twitter:description"), seo.description);
    assert.equal(metaContent(html, "name", "twitter:image"), "https://jlptvoca.com/assets/og.jpg");
    assert.equal(metaContent(html, "name", "twitter:image:alt"), seo.imageAlt);
  }
});

test("root declares an accurate WebSite entity without claiming unreleased features", async () => {
  const root = await readParkingFile("index.html");

  assert.match(root, /itemscope itemtype="https:\/\/schema\.org\/WebSite"/);
  assert.match(root, /itemprop="url" href="https:\/\/jlptvoca\.com\/"/);
  assert.match(root, /itemprop="name" content="JLPT VOCA"/);
  assert.match(root, /itemprop="alternateName" content="jlptvoca\.com"/);
  assert.doesNotMatch(root, /Course|Product|Offer|SoftwareApplication|SearchAction/);

  for (const locale of Object.keys(locales)) {
    assert.doesNotMatch(await readParkingFile(`${locale}/index.html`), /itemtype="https:\/\/schema\.org\/WebSite"/);
  }
});

test("robots exposes crawling and points to the canonical sitemap", async () => {
  const robots = (await readParkingFile("robots.txt")).replaceAll("\r\n", "\n");

  assert.match(robots, /^User-agent: \*$/m);
  assert.match(robots, /^Allow: \/$/m);
  assert.match(robots, /^Sitemap: https:\/\/jlptvoca\.com\/sitemap\.xml$/m);
  assert.doesNotMatch(robots, /^Disallow:/m);
});

test("sitemap contains every and only indexable canonical URL once", async () => {
  const sitemap = await readParkingFile("sitemap.xml");
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, url]) => url);

  assert.match(sitemap, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  assert.match(sitemap, /<urlset[^>]+xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9"/);
  assert.deepEqual(urls, Object.values(seoPages).map(({ url }) => url));
  assert.equal(new Set(urls).size, urls.length);
  assert.doesNotMatch(sitemap, /<lastmod>|<changefreq>|<priority>|404/);
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
  assert.match(html, /<body[^>]+data-page="not-found"/);
  assert.match(html, /href="\/en\/"/);
  assert.doesNotMatch(html, /<link rel="canonical"|<link rel="alternate" hreflang=|itemtype="https:\/\/schema\.org\/WebSite"/);
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
