import * as openpgp from "openpgp";

// User Types ---------------------------------

// type userProfile = {
//     avatar: string
//   strongHoldKey: keyGroup;
// }

export type User = {
  config: UserConfig;
  MasterKey: CryptoKey;
  Pgp: pgpProfile;
};

export type UserId = number;
export type SessionId = number;
export type DisplayId = string;
export type StorageId = string;

export type UserConfig = {
  id: number;
  userId: UserId;
  displayId: DisplayId;
  name: string;
  email: string;
  profile_avatar: string;
};

export type pgpProfile = {
  PrivateKey: string;
  PublicKey: string;
  RevocationCertificate: string;
  ActivePrvKey: openpgp.PrivateKey | null;
};

export type Audience = {
  id: number;
  userId: UserId;
  displayId: DisplayId;
  ownerId: UserId;
  name: string;
  armedPubKey: string;
  isOnline: boolean;
  profileAvatar: string;
};

export type Session = {
  id: number;
  seq: number;
  sessionId: SessionId;
  ownerId: UserId;
  audience: Audience;
  onCreateStage?: boolean;
};

export type GroupSession = {
  sessionId: number;
};

export type MessageStatus =
  | "sending"
  | "sent"
  | "read"
  | "notSend"
  | "notDefiend";

export interface Message {
  id: number;
  seq: number;
  sessionId: SessionId;
  senderId: UserId;
  profile: string;
  content: string;
  createdAt: Date;
  status: MessageStatus;
}

// --- Notification ---
export type NotifType = "info" | "error" | "success" | "warning";
export type Notification = {
  type: NotifType;
  key: string;
  message: string;
  timeOut?: number;
};

// Constants-----------------------------------

export const MAIN_KEY = "main_key";
export const KEYCHAIN_USER = "Marble";

export const DefEncoder = new TextEncoder();
export const DefDecoder = new TextDecoder();
