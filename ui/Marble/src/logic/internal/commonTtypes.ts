import { PrivateKey } from "openpgp";

export type auth = "login" | "signup" | "resetpass";

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
  address: string;
  identityKey: KeyGroup;
  sessions: Record<string, { sessionId: number, storageId: string }>
  storagePath: string
};

export type KeyGroup = {
  privateKey: string;
  publicKey: string;
  revocationCertificate: string;
};

export type UserHold = {
  users: Record<string, UserConfig>
  primaryUser: string | null
}

export interface MessageProps {
  id: string;
  content: string;
  sender: 'user' | 'audience';
  timestamp: Date;
  status?: 'sent' | 'delivered' | 'read';
  senderName?: string;
}


// Constants
export const MARBLE_STRONGHOLD_KEY = "marble_stronghold";
export const STRONGHOLD_OBJECT_KEYS = {
  Users: "users",
}
export const KEYCHAIN_USER = "Marble";
