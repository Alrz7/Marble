import { create } from "zustand";
import { User } from "../internal/commonTypes";

interface userState {
  currentUser: User | null;
  setUserData: (newUser: User | null) => void;
}
export const AppUser = create<userState>((set) => ({
  currentUser: null,
  setUserData: (newUser: User | null) => set({ currentUser: newUser }),
}));
