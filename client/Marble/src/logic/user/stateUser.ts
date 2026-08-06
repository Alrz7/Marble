import { create } from "zustand";
import { User } from "@internal/intrCmnTypes";

interface userState {
  currentUser: User | null;
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
  setUserData: (newUser: User | null) => void;
  resetUserData: () => void;
}

const initialUserStates = {
  currentUser: null,
  accessToken: null,
};
export const AppUser = create<userState>((set) => ({
  ...initialUserStates,
  setAccessToken: (token: string | null) => set({ accessToken: token }),
  setUserData: (newUser: User | null) => set({ currentUser: newUser }),
  resetUserData: () => set(initialUserStates),
}));
