const sessionKey = "mapofmath:selected-center";

export interface SessionSelection {
  id: string;
  slug: string;
  title: string;
}

export function readSessionSelection(): SessionSelection | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(sessionKey);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as SessionSelection;
    if (parsed.id && parsed.slug && parsed.title) {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
}

export function writeSessionSelection(selection: SessionSelection | null): void {
  if (typeof window === "undefined") {
    return;
  }

  if (!selection) {
    window.sessionStorage.removeItem(sessionKey);
    return;
  }

  window.sessionStorage.setItem(sessionKey, JSON.stringify(selection));
}
