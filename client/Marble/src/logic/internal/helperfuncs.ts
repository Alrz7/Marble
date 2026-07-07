import { StorageId } from "./commonTypes";

export const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export function getRandomString(length: number): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((x) => chars[x % chars.length])
    .join("");
}

export function getUserStoragePath(): string {
  const randIdString = getRandomString(12);
  return `Marble-stg@${randIdString}.json`;
}

export function GenRandStorageId(): StorageId {
  return getRandomString(16);
}

export function blobFromDb(value: unknown): Uint8Array {
  if (value instanceof Uint8Array) {
    return value;
  }

  if (Array.isArray(value)) {
    return Uint8Array.from(value as number[]);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (trimmed.startsWith("[")) {
      const parsed = JSON.parse(trimmed) as number[];
      return Uint8Array.from(parsed);
    }

    const parts = trimmed.split(",").map((p) => Number(p.trim()));
    if (parts.some((n) => Number.isNaN(n))) {
      throw new TypeError("blobFromDb: could not parse string blob");
    }
    return Uint8Array.from(parts);
  }

  throw new TypeError(`blobFromDb: unsupported blob type: ${typeof value}`);
}