import { PrivateKey } from "openpgp";

export type auth = "login" | "signup" | "resetpass";

export interface User {
  config: UserConfig;
  prvIdentKey: PrivateKey;
}
export interface UserConfig {
  name: string;
  email: string;
  id: string;
  address: string;
  identityKey: KeyGroup;
  primary: boolean;
  // avatar: string
  // strongHoldKey: keyGroup;
};

export interface KeyGroup {
  privateKey: string;
  publicKey: string;
  revocationCertificate: string;
};
// Constants
export const MARBLE_STRONGHOLD_KEY = "marble_stronghold";
export const DEFAULT_OBJECT_KEY = "default_object";
export const KEYCHAIN_USER = "Marble"; // Username for Keychain access