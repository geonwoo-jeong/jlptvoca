import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_LOCALE,
  STORAGE_KEY,
  normalizeLocale,
  readStoredLocale,
  selectLocale,
  writeStoredLocale,
} from "../parking/assets/locale.js";
import { getBrowserStorage, initializeLocaleNavigation } from "../parking/assets/site.js";

test("normalizes supported language and regional tags", () => {
  assert.equal(normalizeLocale("en"), "en");
  assert.equal(normalizeLocale(" VI-vn "), "vi");
  assert.equal(normalizeLocale("id_ID"), "id");
  assert.equal(normalizeLocale("in-ID"), "id");
});

test("rejects unsupported or malformed locales", () => {
  assert.equal(normalizeLocale("ko-KR"), null);
  assert.equal(normalizeLocale("ja-JP"), null);
  assert.equal(normalizeLocale(""), null);
  assert.equal(normalizeLocale(null), null);
  assert.equal(normalizeLocale({ locale: "vi" }), null);
});

test("prefers an explicit stored choice over browser languages", () => {
  assert.equal(
    selectLocale({ storedLocale: "id", languages: ["vi-VN", "en-US"] }),
    "id",
  );
});

test("uses the first supported browser language and skips unsupported entries", () => {
  assert.equal(
    selectLocale({ languages: ["ja-JP", "vi-VN", "en-US"] }),
    "vi",
  );
  assert.equal(
    selectLocale({ languages: ["ko-KR", "in-ID", "en-US"] }),
    "id",
  );
});

test("uses navigator.language and then English as the final fallback", () => {
  assert.equal(selectLocale({ languages: [], language: "en-GB" }), "en");
  assert.equal(selectLocale({ languages: [], language: "ja-JP" }), DEFAULT_LOCALE);
  assert.equal(selectLocale(), DEFAULT_LOCALE);
});

test("ignores invalid saved values", () => {
  assert.equal(
    selectLocale({ storedLocale: "<script>", languages: ["vi-VN"] }),
    "vi",
  );
});

test("storage helpers handle unavailable browser storage", () => {
  const brokenStorage = {
    getItem() {
      throw new Error("blocked");
    },
    setItem() {
      throw new Error("blocked");
    },
  };

  assert.equal(readStoredLocale(brokenStorage), null);
  assert.equal(writeStoredLocale(brokenStorage, "vi"), false);
  assert.equal(readStoredLocale(null), null);
  assert.equal(writeStoredLocale(null, "vi"), false);
});

test("storage helpers accept only allowlisted locale values", () => {
  const values = new Map();
  const storage = {
    getItem(key) {
      return values.get(key);
    },
    setItem(key, value) {
      values.set(key, value);
    },
  };

  assert.equal(writeStoredLocale(storage, "VI-vn"), true);
  assert.equal(values.get(STORAGE_KEY), "vi");
  assert.equal(readStoredLocale(storage), "vi");
  assert.equal(writeStoredLocale(storage, "ko"), false);
});

function createEnvironment({ page = "locale", locale = "", languages = ["en-US"] } = {}) {
  const stored = new Map();
  const listeners = new Map();
  const links = ["en", "vi", "id"].map((linkLocale) => ({
    attributes: {},
    dataset: { locale: linkLocale },
    href: `https://jlptvoca.com/${linkLocale}/`,
    addEventListener(eventName, callback) {
      listeners.set(`${linkLocale}:${eventName}`, callback);
    },
    setAttribute(name, value) {
      this.attributes[name] = value;
    },
  }));
  const document = {
    body: { dataset: { page, locale } },
    querySelector(selector) {
      const match = selector.match(/data-locale="([a-z]+)"/);
      return links.find((link) => link.dataset.locale === match?.[1]) ?? null;
    },
    querySelectorAll() {
      return links;
    },
  };
  const storage = {
    getItem(key) {
      return stored.get(key);
    },
    setItem(key, value) {
      stored.set(key, value);
    },
  };
  let replacedUrl = null;
  const location = {
    replace(url) {
      replacedUrl = url;
    },
  };

  return {
    document,
    languages,
    links,
    listeners,
    location,
    storage,
    stored,
    getReplacedUrl: () => replacedUrl,
  };
}

test("root gateway highlights the detected locale without redirecting", () => {
  const environment = createEnvironment({ page: "gateway", languages: ["ja-JP", "vi-VN"] });

  const result = initializeLocaleNavigation({
    document: environment.document,
    navigator: { languages: environment.languages, language: "ja-JP" },
    location: environment.location,
    storage: environment.storage,
  });

  assert.equal(result, "vi");
  const recommendedLink = environment.links.find((link) => link.dataset.locale === "vi");
  assert.equal(recommendedLink.dataset.recommended, "true");
  assert.equal(recommendedLink.attributes["aria-describedby"], "language-recommendation");
  assert.equal(environment.getReplacedUrl(), null);
});

test("an explicit locale page saves its locale without redirecting", () => {
  const environment = createEnvironment({ locale: "id" });

  const result = initializeLocaleNavigation({
    document: environment.document,
    navigator: { languages: ["vi-VN"] },
    location: environment.location,
    storage: environment.storage,
  });

  assert.equal(result, "id");
  assert.equal(environment.stored.get(STORAGE_KEY), "id");
  assert.equal(environment.getReplacedUrl(), null);
});

test("language links remember a valid manual choice", () => {
  const environment = createEnvironment({ locale: "en" });
  initializeLocaleNavigation({
    document: environment.document,
    navigator: { languages: ["en-US"] },
    location: environment.location,
    storage: environment.storage,
  });

  environment.listeners.get("vi:click")();
  assert.equal(environment.stored.get(STORAGE_KEY), "vi");
});

test("initialization is a safe no-op when browser dependencies are missing", () => {
  assert.equal(initializeLocaleNavigation(), DEFAULT_LOCALE);
});

test("browser storage access is safe when the getter is blocked", () => {
  const blockedWindow = {};
  Object.defineProperty(blockedWindow, "localStorage", {
    get() {
      throw new Error("blocked");
    },
  });

  assert.equal(getBrowserStorage(blockedWindow), null);
  assert.equal(getBrowserStorage(null), null);
});
