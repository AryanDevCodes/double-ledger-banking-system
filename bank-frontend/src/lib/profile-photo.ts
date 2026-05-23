const PROFILE_PHOTO_STORAGE_PREFIX = "sb.profile.photo.url";

function getStorageKey(userId?: number | string | null): string | null {
  if (userId === null || userId === undefined) {
    return null;
  }
  return `${PROFILE_PHOTO_STORAGE_PREFIX}.${userId}`;
}

export function normalizeProfilePhotoUrl(rawValue: string): string | null {
  const value = rawValue.trim();
  if (!value) {
    return null;
  }

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

export function loadProfilePhotoUrl(userId?: number | string | null): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const key = getStorageKey(userId);
  if (!key) {
    return null;
  }

  const value = localStorage.getItem(key);
  return value && value.trim() ? value : null;
}

export function persistProfilePhotoUrl(userId: number | string | null | undefined, url: string | null): void {
  if (typeof window === "undefined") {
    return;
  }

  const key = getStorageKey(userId);
  if (!key) {
    return;
  }

  if (url && url.trim()) {
    localStorage.setItem(key, url);
  } else {
    localStorage.removeItem(key);
  }
}
