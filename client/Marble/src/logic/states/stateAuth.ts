import { AuthMethod, RecoveryModes } from "@internal/intrCmnTypes";
import { create } from "zustand";

export type Steps = 1 | 2 | 3 | 4;

type StateSignUp = {
  step: Steps;
  setStep: (stp: Steps) => void;
  name: string;
  setName: (name: string) => void;
  username: string;
  setUsername: (username: string) => void;
  email: string;
  setEmail: (email: string) => void;
  recoveryMode: RecoveryModes;
  setRecoveryMode: (mode: RecoveryModes) => void;
  generatedRecoveryKey: string;
  customRecoveryKey: string;
  setGeneratedRecoveryKey: (key: string) => void;
  setCustomRecoveryKey: (key: string) => void;
  showKeyModal: boolean;
  setShowKeyModal: (val: boolean) => void;
  authMethod: AuthMethod;
  setAuthMethod: (method: AuthMethod) => void;
  passphrase: string;
  setPassphrase: (pass: string) => void;
  confirmPassphrase: string;
  setConfirmPassphrase: (pass: string) => void;
  showPassphrase: boolean;
  setShowPassphrase: (val: boolean) => void;
  isLoading: boolean;
  setIsLoading: (val: boolean) => void;
  resetSignUpStore: () => void;
};

const initialSignUpStates = {
  step: 1 as Steps,
  name: "",
  username: "",
  email: "",
  recoveryMode: null as RecoveryModes,
  generatedRecoveryKey: "",
  customRecoveryKey: "",
  showKeyModal: false,
  authMethod: "keychain" as AuthMethod,
  passphrase: "",
  confirmPassphrase: "",
  showPassphrase: false,
  isLoading: false,
};

export const stateSignUp = create<StateSignUp>((set) => ({
  ...initialSignUpStates,
  setStep: (step) => set({ step }),
  setName: (name) => set({ name }),
  setUsername: (username) => set({ username }),
  setEmail: (email) => set({ email }),
  setRecoveryMode: (recoveryMode) => set({ recoveryMode }),
  setGeneratedRecoveryKey: (generatedRecoveryKey) =>
    set({ generatedRecoveryKey }),
  setCustomRecoveryKey: (customRecoveryKey) => set({ customRecoveryKey }),
  setShowKeyModal: (showKeyModal) => set({ showKeyModal }),
  setAuthMethod: (authMethod) => set({ authMethod }),
  setPassphrase: (passphrase) => set({ passphrase }),
  setConfirmPassphrase: (confirmPassphrase) => set({ confirmPassphrase }),
  setShowPassphrase: (showPassphrase) => set({ showPassphrase }),
  setIsLoading: (isLoading) => set({ isLoading }),
  resetSignUpStore: () => set(initialSignUpStates),
}));

// ---------- Login -----------
export type LoginStep = 1 | 2 | 3;
export interface LoginState {
  step: LoginStep;
  username: string;
  password: string;
  authMethod: AuthMethod;
  passphrase: string;
  isLoading: boolean;

  setStep: (step: LoginStep | ((s: LoginStep) => LoginStep)) => void;
  setUsername: (username: string) => void;
  setPassword: (password: string) => void;
  setAuthMethod: (authMethod: AuthMethod) => void;
  setPassphrase: (passphrase: string) => void;
  setIsLoading: (isLoading: boolean) => void;
  resetLoginStore: () => void;
}

const initialLoginStates = {
  step: 1 as LoginStep,
  username: "",
  password: "",
  authMethod: "passphrase" as AuthMethod,
  passphrase: "",
  isLoading: false,
};
export const stateLogin = create<LoginState>((set) => ({
  ...initialLoginStates,
  setStep: (stepOrUpdater) =>
    set((state) => ({
      step:
        typeof stepOrUpdater === "function"
          ? stepOrUpdater(state.step)
          : stepOrUpdater,
    })),
  setUsername: (username) => set({ username }),
  setPassword: (password) => set({ password }),
  setAuthMethod: (authMethod) => set({ authMethod }),
  setPassphrase: (passphrase) => set({ passphrase }),
  setIsLoading: (isLoading) => set({ isLoading }),
  resetLoginStore: () => set(initialLoginStates),
}));
