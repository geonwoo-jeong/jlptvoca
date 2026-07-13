export const SUPPORTED_LOCALES = Object.freeze(["en", "vi", "id"]);
export const DEFAULT_LOCALE = "en";
export const STORAGE_KEY = "jlptvoca.parking.locale";

const LEGACY_LOCALE_ALIASES = Object.freeze({ in: "id" });

export function normalizeLocale(value) {
  if (typeof value !== "string") {
    return null;
  }

  const language = value.trim().toLowerCase().replaceAll("_", "-").split("-")[0];
  const normalized = LEGACY_LOCALE_ALIASES[language] ?? language;
  return SUPPORTED_LOCALES.includes(normalized) ? normalized : null;
}

export function selectLocale({ storedLocale, languages = [], language } = {}) {
  const savedChoice = normalizeLocale(storedLocale);
  if (savedChoice) {
    return savedChoice;
  }

  const browserLanguages = Array.isArray(languages) ? languages : [];
  for (const browserLanguage of browserLanguages) {
    const normalized = normalizeLocale(browserLanguage);
    if (normalized) {
      return normalized;
    }
  }

  return normalizeLocale(language) ?? DEFAULT_LOCALE;
}

export function readStoredLocale(storage) {
  try {
    return normalizeLocale(storage?.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

export function writeStoredLocale(storage, locale) {
  const normalized = normalizeLocale(locale);
  if (!storage || !normalized) {
    return false;
  }

  try {
    storage.setItem(STORAGE_KEY, normalized);
    return true;
  } catch {
    return false;
  }
}
