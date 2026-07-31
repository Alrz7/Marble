import { Audience, SessionId } from "./intrCmnTypes";

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

// ----------   State Variables   -----------

export const StateVariables = {
  SYNCED_SESSION: "syncedSession",
  AUTHORIZED: "authorized",
  SHOW_PROFILE_PANEL: "showProfilePanel",
};

// --------- Notification Common Keys ---------
export const NotificationKeys = {
  SESSION_NOT_VALID: "sessionIsNotValid",
  SESSION_REJECTED_BY_SERVER: "sessionBeenRejected",
  REQUEST_NOT_SENT: "requestNotSent",
  MESSAGE_REQUEAST_TIMEDOUT: "MessageRequestTimedOut",
};

//-----------
export const SavedMessagesSesionId: SessionId = -1;
export const savedMessagesAudience: Audience = {
  id: -1,
  userId: -1,
  displayId: "SavedMessages",
  ownerId: -1,
  name: "Saved Messages",
  armedPubKey: "",
  isOnline: true,
  profileAvatar: "",
  isSavedMessages: true,
};
