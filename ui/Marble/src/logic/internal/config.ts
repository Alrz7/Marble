export interface application {
  name: string;
  stage: string;
  openpgp: cfgOpenpgp;
};
export interface cfgOpenpgp {
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
