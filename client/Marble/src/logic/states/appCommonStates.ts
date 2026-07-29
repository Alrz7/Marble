import { StateVariables } from "./../internal/intrCmnVars";
import { create } from "zustand";
import { Audience } from "@internal/intrCmnTypes";

export type PAGES = "loading" | "login" | "signup";
interface AppState {
  appState: PAGES;
  setAppState: (newState: PAGES) => void;
}

export const AppState = create<AppState>((set) => ({
  appState: "loading",
  setAppState: (newState: PAGES) => set({ appState: newState }),
}));

// ---- Common ----
type sTypes = string | boolean | number;

export const stateCommon = create<{
  states: Map<string, sTypes>;
  setState: (key: string, val: sTypes) => void;
}>((set) => ({
  states: new Map<string, sTypes>([
    [StateVariables.AUTHORIZED, false],
    [StateVariables.SYNCED_SESSION, false],
    [StateVariables.SHOW_PROFILE_PANEL, false],
  ]),
  setState: (key: string, val: sTypes) =>
    set((state) => {
      const next = new Map<string, sTypes>(state.states);
      next.set(key, val);
      return { states: next };
    }),
}));

//  -- Search State --
interface SearchResult {
  searchQuery: string;
  showSearchResults: boolean;
  Users: Audience[];
  setSearchQuery: (query: string) => void;
  setShowSearchResults: (val: boolean) => void;
  setUsers: (users: Audience[]) => void;
  addtoUsers: (newUsers: Audience[]) => void;
}
export const searchResult = create<SearchResult>((set) => ({
  searchQuery: "",
  showSearchResults: false,
  Users: [],
  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setShowSearchResults: (val: boolean) => set({ showSearchResults: val }),
  setUsers: (users: Audience[]) => set({ Users: users }),
  addtoUsers: (newUsers: Audience[]) =>
    set((state) => ({ Users: [...state.Users, ...newUsers] })),
}));

export async function ResetSearchPrcs() {
  const { setSearchQuery, setShowSearchResults, setUsers } =
    searchResult.getState();
  setUsers([]);
  setSearchQuery("");
  setShowSearchResults(false);
}
