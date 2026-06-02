import { PrivateKey } from "openpgp";
// User Types ---------------------------------

// type userProfile = {
//     avatar: string
//   strongHoldKey: keyGroup;
// }

export type User = {
  config: UserConfig;
  prvIdentKey: PrivateKey;
  // profile: userProfile
};
export type UserConfig = {
  name: string;
  email: string;
  id: number;
  display_id: string;
  identityKey: KeyGroup;
  sessions: Record<string, sessionAudience>;
  storagePath: string;
};
export type sessionAudience = Audience & {
  sessionId: number;
  storageId: string;
};

export type Audience = {
  name: string;
  userId: number;
  displayId: string;
  armedPubKey: string;
};

export type GroupSession = {
  sessionId: number;
};

export type Session = {
  sessionId: number;
  beta: Audience;
};

export interface MessageProps {
  id: string;
  content: string;
  sender: "user" | "audience";
  timestamp: Date;
  status?: "sent" | "delivered" | "read";
  senderName?: string;
}

// --- Tsx ----

// ---- enc ----

export type KeyGroup = {
  privateKey: string;
  publicKey: string;
  revocationCertificate: string;
};

export type UserHold = {
  users: Record<string, UserConfig>;
  primaryUser: string | null;
};

// Constants-----------------------------------

export const MARBLE_STRONGHOLD_KEY = "marble_stronghold";
export const STRONGHOLD_OBJECT_KEYS = {
  Users: "users",
};
export const KEYCHAIN_USER = "Marble";
