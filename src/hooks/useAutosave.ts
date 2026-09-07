import { useEffect, useRef } from "react";

// A2: debounced autosave of arbitrary JSON-serialisable state to localStorage.
// Used by the project form so long case-study edits survive navigation,
// accidental closes, or an expired auth token.

const PREFIX = "admin-draft-v1:";

export function draftKey(id: string | null): string {
  return `${PREFIX}${id ?? "new"}`;
}

export function readDraft<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function clearDraft(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/**
 * Persists `value` to localStorage under `key`, debounced.
 * Skips the very first run so opening an existing project doesn't
 * immediately overwrite/echo an existing draft.
 */
export function useAutosave<T>(
  key: string,
  value: T,
  enabled: boolean,
  delay = 800
): void {
  const isFirst = useRef(true);

  useEffect(() => {
    if (!enabled) return;
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    const handle = window.setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        /* quota or serialisation error — ignore, autosave is best-effort */
      }
    }, delay);
    return () => window.clearTimeout(handle);
  }, [key, value, enabled, delay]);
}
