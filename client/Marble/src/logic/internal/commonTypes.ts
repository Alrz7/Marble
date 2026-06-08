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

export type UserId = number;
export type SessionId = number;
export type DisplayId = string;

export type UserConfig = {
  name: string;
  email: string;
  id: number;
  display_id: DisplayId;
  identityKey: KeyGroup;
  storeKey: KeyGroup;
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
};

export type Session = {
  sessionId: number;
  storageId: string;
  onCreateStage?: boolean;
  beta: Audience;
};

export type GroupSession = {
  sessionId: number;
};

export interface MessageProps {
  id: number;
  content: string;
  senderId: UserId;
  senderName: string;
  timestamp: Date;
  status?: "sent" | "delivered" | "read";
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

// --- Notification ---

export type Notification = {
  type: "info" | "error" | "success" | "warning";
  key: string;
  message: string;
};

// Constants-----------------------------------

export const MARBLE_STRONGHOLD_KEY = "marble_stronghold";
export const STRONGHOLD_OBJECT_KEYS = {
  Users: "users",
};
export const KEYCHAIN_USER = "Marble";
