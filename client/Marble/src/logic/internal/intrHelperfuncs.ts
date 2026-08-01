import { commonErrors, err, errEdtMessage, ok, Result } from "./golog";
import { SessionId, StorageId } from "./intrCmnTypes";
import { SavedMessagesSesionId } from "./intrCmnVars";

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

export function blobFromDb(value: unknown): Result<Uint8Array> {
  if (value instanceof Uint8Array) {
    return ok(value);
  }

  if (Array.isArray(value)) {
    return ok(Uint8Array.from(value as number[]));
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (trimmed.startsWith("[")) {
      const parsed = JSON.parse(trimmed) as number[];
      return ok(Uint8Array.from(parsed));
    }

    const parts = trimmed.split(",").map((p) => Number(p.trim()));
    if (parts.some((n) => Number.isNaN(n))) {
      return err(
        errEdtMessage(
          commonErrors.connectionFailed,
          "blobFromDb: could not parse string blob",
        ),
      );
    }
    return ok(Uint8Array.from(parts));
  }

  return err(
    errEdtMessage(
      commonErrors.unexpectedInput,
      `blobFromDb: unsupported blob type: ${typeof value}`,
    ),
  );
}

export function isItSavedMessages(sessionId: SessionId): boolean {
  return sessionId === SavedMessagesSesionId;
}
