import { create } from "zustand";
import { User } from "@internal/intrCmnTypes";

interface userState {
  currentUser: User | null;
  setUserData: (newUser: User | null) => void;
  resetUserData: () => void;
}

const initialUserStates = {
  currentUser: null,
};
export const AppUser = create<userState>((set) => ({
  ...initialUserStates,
  setUserData: (newUser: User | null) => set({ currentUser: newUser }),
  resetUserData: ()=> set(initialUserStates)
}));
