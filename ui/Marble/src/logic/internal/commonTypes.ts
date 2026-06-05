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

export type UserId = number 
export type SessionId = number 
export type DisplayId = string;

export type UserConfig = {
  name: string;
  email: string;
  id: number;
  display_id: DisplayId;
  identityKey: KeyGroup;
  sessions: Record<UserId, Session>;
  storagePath: string;
};

export type Audience = {
  name: string;
  userId: UserId;
  displayId: DisplayId;
  armedPubKey: string;
  isOnline: boolean;
  ProfileAvatar: string;
  sessionId: number;
  storageId: string;
};

export type Session = {
  sessionId: number;
  beta: Audience;
};


export type GroupSession = {
  sessionId: number;
};


export interface MessageProps {
  id: string;
  content: string;
  sender: "user" | "audience";
  timestamp: Date;
  status?: "sent" | "delivered" | "read";
  senderName?: string;
}

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
