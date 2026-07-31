import { addNewNotification } from "@states/stateNotif";
import { NotifType } from "./intrCmnTypes";
export interface AppError {
  reason: string;
  message: string;
  details?: unknown;
}

export type Result<T, E = AppError> =
  | { ok: true; value: T; error?: never }
  | { ok: false; error: E; value?: never };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

export const fromThrowable = <T, E = AppError>(
  fn: () => T,
  errorFn: (e: unknown) => E,
): Result<T, E> => {
  try {
    return ok(fn());
  } catch (e) {
    return err(errorFn(e));
  }
};

export const fromPromise = async <T, E = AppError>(
  promise: Promise<T>,
  errorFn: (e: unknown) => E,
): Promise<Result<T, E>> => {
  try {
    const value = await promise;
    return ok(value);
  } catch (e) {
    return err(errorFn(e));
  }
};

export const addOnErr = (cmnErr: AppError, err: unknown): AppError => {
  return { reason: cmnErr.reason, message: `${cmnErr.message}: ${err}` };
};

export const addAppErrNotif = (
  err: AppError,
  type: NotifType = "error",
): void => {
  addNewNotification(type, err.reason, err.message);
};

export const commonErrors = {
  // --- Auth & Session ---
  notAuthorized: {
    reason: "notAuthorized",
    message: "Connection is not authorized",
  },
  sessionNotValid: {
    reason: "sessionNotValid",
    message: "Session is not valid",
  },
  sessionNotFound: {
    reason: "sessionNotFound",
    message: "Session is not found",
  },
  sessionNotLegit: {
    reason: "sessionNotLegit",
    message: "Session is not validated by server",
  },
  sessionRejected: {
    reason: "sessionRejected",
    message: "Session has been rejected by server",
  },
  userNotValid: {
    reason: "userNotValid",
    message: "User is not valid, please log out and try again",
  },
  userNotFound: {
    reason: "userNotFound",
    message: "User was not found",
  },

  // --- Crypto & Keychain ---
  keychainKeyNotValid: {
    reason: "keychainKeyNotValid",
    message: "Keychain key is not valid",
  },
  keychainKeyNotFound: {
    reason: "keychainKeyNotFound",
    message: "Keychain key was not found",
  },
  invalidPrivateKey: {
    reason: "invalidPrivateKey",
    message: "Private key is not valid",
  },
  decryptionFailed: {
    reason: "decryptionFailed",
    message: "Failed to decrypt the crypto key",
  },

  // --- Network & Database ---
  connectionFailed: {
    reason: "connectionFailed",
    message: "Connection failed",
  },
  dbConnectionFailed: {
    reason: "dbConnectionFailed",
    message: "Failed to connect to database",
  },
  insertFailed: {
    reason: "insertFailed",
    message: "Error while inserting record",
  },
  noRecordFound: {
    reason: "noRecordFound",
    message: "No record found",
  },

  // --- Data & Validation ---
  encryptionFailed: {
    reason: "encryptionFailed",
    message: "Error while encrypting data",
  },
  conversionFailed: {
    reason: "conversionFailed",
    message: "Error while converting data",
  },
  invalidEncodedData: {
    reason: "invalidEncodedData",
    message: "Encoded data is missing expected structure",
  },
  unexpectedInput: {
    reason: "unexpectedInput",
    message: "Unexpected input provided to function",
  },
  invalidAudience: {
    reason: "invalidAudience",
    message: "Error while validating audience",
  },
  audienceNotFound: {
    reason: "audienceNotFound",
    message: "Failed to fetch audience",
  },

  // --- General & Fallback ---
  unexpectedError: {
    reason: "unexpectedError",
    message: "An unexpected error occurred",
  },
} as const satisfies Record<string, AppError>;

export type CommonErrorKey = keyof typeof commonErrors;
export type CommonError = (typeof commonErrors)[CommonErrorKey];

export function makeError(error: AppError, details?: unknown): AppError {
  return { ...error, details };
}
