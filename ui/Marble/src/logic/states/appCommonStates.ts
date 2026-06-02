import { create } from "zustand";

type pages = "loading" | "login" | "signup";
interface AppState {
  appState: pages;
  setAppState: (newState: pages) => void;
}

export const AppState = create<AppState>((set) => ({
  appState: "loading",
  setAppState: (newState: pages) => set({ appState: newState }),
}));
