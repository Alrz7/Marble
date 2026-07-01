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
