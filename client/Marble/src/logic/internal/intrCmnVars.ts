export interface application {
  name: string;
  stage: string;
  openpgp: cfgOpenpgp;
}

// --- enc ---
export type cfgOpenpgp = {
  encType: "curve25519" | "ecc" | "rsa" | "curve448" | undefined;
  encFormat: "armored" | "binary" | "object";
  lockPrvIdentityKey: boolean;
};

export const app: application = {
  name: "Marble",
  stage: "dev",
  openpgp: {
    encType: "curve25519",
    encFormat: "armored",
    lockPrvIdentityKey: true,
  },
};

// --------- Notification Common Keys ---------
export const SESSION_NOT_VALID = "sessionIsNotValid";
export const REQUEST_NOT_SENT = "requestNotSent";
export const AUTHORIZED = "authorized";
export const SYNCED_SESSION = "syncedSession";
