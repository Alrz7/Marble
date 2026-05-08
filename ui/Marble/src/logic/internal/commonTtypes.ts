import { PrivateKey } from "openpgp";

export type auth = "login" | "signup" | "resetpass";

export interface User {
  config: UserConfig;
  prvIdentKey: PrivateKey;
}
export interface UserConfig {
  name: string;
  email: string;
  id: number;
  address: string;
  identityKey: KeyGroup;
  sessions: Record<string, number>
  // avatar: string
  // strongHoldKey: keyGroup;
};

export interface KeyGroup {
  privateKey: string;
  publicKey: string;
  revocationCertificate: string;
};

export type UserHold = {
  users: Record<string, UserConfig>
  primaryUser: string | null
}

// Constants
export const MARBLE_STRONGHOLD_KEY = "marble_stronghold";
export const STRONGHOLD_OBJECT_KEYS = {
  Users: "users",
}
export const KEYCHAIN_USER = "Marble"; // Username for Keychain access