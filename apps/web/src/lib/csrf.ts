const csrfStorageKey = "supademo.csrf-token";

export function readCsrfToken(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const token = window.sessionStorage.getItem(csrfStorageKey);
  return token && /^[A-Za-z0-9-]{16,256}$/u.test(token) ? token : undefined;
}

export function saveCsrfToken(token: string | undefined): void {
  if (typeof window === "undefined") return;
  if (token && /^[A-Za-z0-9-]{16,256}$/u.test(token)) {
    window.sessionStorage.setItem(csrfStorageKey, token);
    return;
  }
  window.sessionStorage.removeItem(csrfStorageKey);
}
