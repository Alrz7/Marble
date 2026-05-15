import { PrivateKey } from "openpgp";
export type auth = "login" | "signup" | "resetpass";


// User Types ---------------------------------

// type userProfile = {
//     avatar: string
//   strongHoldKey: keyGroup;
// }

export type User = {
  config: UserConfig;
  prvIdentKey: PrivateKey;
  // profile: userProfile
}
export type UserConfig = {
  name: string;
  email: string;
  id: number;
  display_id: string;
  identityKey: KeyGroup;
  sessions: Record<string, { sessionId: number, storageId: string }>
  storagePath: string
};

export type GroupSession = {}

export type Session = {
  sessionId: number
  beta: string
}

export interface MessageProps {
  id: string;
  content: string;
  sender: 'user' | 'audience';
  timestamp: Date;
  status?: 'sent' | 'delivered' | 'read';
  senderName?: string;
}

export type KeyGroup = {
  privateKey: string;
  publicKey: string;
  revocationCertificate: string;
};

export type UserHold = {
  users: Record<string, UserConfig>
  primaryUser: string | null
}


// Constants-----------------------------------

export const MARBLE_STRONGHOLD_KEY = "marble_stronghold";
export const STRONGHOLD_OBJECT_KEYS = {
  Users: "users",
}
export const KEYCHAIN_USER = "Marble";
