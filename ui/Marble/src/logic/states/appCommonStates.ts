import { create } from "zustand";
import { Audience } from "../internal/commonTypes";

type pages = "loading" | "login" | "signup";
interface AppState {
  appState: pages;
  setAppState: (newState: pages) => void;
}

export const AppState = create<AppState>((set) => ({
  appState: "loading",
  setAppState: (newState: pages) => set({ appState: newState }),
}));

// ---- auth ----
export const Authorized = create<{
  isComplete: boolean;
  setState: (state: boolean) => void;
}>((set) => ({
  isComplete: false,
  setState: (state: boolean) => set({ isComplete: state }),
}));
//  -- Search State --
interface SearchResult {
  Users: Audience[];
  setUsers: (users: Audience[]) => void;
  addtoUsers: (origin: Audience[], newUsers: Audience[]) => void;
}
export const searchResult = create<SearchResult>((set) => ({
  Users: [],
  setUsers: (users: Audience[]) => set({ Users: users }),
  addtoUsers: (origin: Audience[], newUsers: Audience[]) =>
    set({ Users: [...origin, ...newUsers] }),
}));
