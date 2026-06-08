import { getRandomString } from "../internal/helperfuncs";

export function getUserStoragePath(): string {
  const randIdString = getRandomString(12);
  return `Marble-stg@${randIdString}.json`;
}

export function getSessionStorageId(): string {
  const randIdString = getRandomString(10);
  return `USI@${randIdString}`;
}
