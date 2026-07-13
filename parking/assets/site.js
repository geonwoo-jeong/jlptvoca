import {
  DEFAULT_LOCALE,
  normalizeLocale,
  readStoredLocale,
  selectLocale,
  writeStoredLocale,
} from "./locale.js";

export function initializeLocaleNavigation({
  document,
  navigator,
  location,
  storage,
} = {}) {
  if (!document?.body) {
    return DEFAULT_LOCALE;
  }

  const localeLinks = [...document.querySelectorAll("[data-locale]")];
  for (const link of localeLinks) {
    link.addEventListener("click", () => {
      writeStoredLocale(storage, link.dataset.locale);
    });
  }

  const pageLocale = normalizeLocale(document.body.dataset.locale);
  if (pageLocale) {
    writeStoredLocale(storage, pageLocale);
    return pageLocale;
  }

  if (document.body.dataset.page !== "router") {
    return DEFAULT_LOCALE;
  }

  const selectedLocale = selectLocale({
    storedLocale: readStoredLocale(storage),
    languages: navigator?.languages,
    language: navigator?.language,
  });
  const destination = document.querySelector(`[data-locale="${selectedLocale}"]`);

  if (destination?.href && typeof location?.replace === "function") {
    location.replace(destination.href);
  }

  return selectedLocale;
}

export function getBrowserStorage(windowLike) {
  try {
    return windowLike?.localStorage ?? null;
  } catch {
    return null;
  }
}

if (typeof window !== "undefined") {
  initializeLocaleNavigation({
    document: window.document,
    navigator: window.navigator,
    location: window.location,
    storage: getBrowserStorage(window),
  });
}
