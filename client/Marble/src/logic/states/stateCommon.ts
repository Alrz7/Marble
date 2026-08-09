import { StateVariables } from "../internal/intrCmnVars";
import { create } from "zustand";
import { Audience } from "@internal/intrCmnTypes";

export type PAGES =
  | "loading"
  | "login"
  | "signup"
  | "dayilyLogin"
type connectionTitles =
  | "waiting for network..."
  | "connecting..."
  | "authorizing..."
  | "Marble";
interface AppState {
  appState: PAGES;
  serverUrl: string | null;
  connTitle: connectionTitles;
  isSettingOpen: boolean;
  setAppState: (newState: PAGES) => void;
  setServerUrl: (url: string | null) => void;
  setConnTitle: (newTitle: connectionTitles) => void;
  setIsSettingOpen: (val: boolean) => void;
  resetAppStates: () => void;
}

const initialAppState = {
  appState: "loading" as PAGES,
  serverUrl: null,
  connTitle: "waiting for network..." as connectionTitles,
  isSettingOpen: false,
};

export const AppState = create<AppState>((set) => ({
  ...initialAppState,
  setAppState: (newState: PAGES) => set({ appState: newState }),
  setServerUrl: (url: string | null) => set({ serverUrl: url }),
  setConnTitle: (newTitle: connectionTitles) => set({ connTitle: newTitle }),
  setIsSettingOpen: (val: boolean) => set({ isSettingOpen: val }),
  resetAppStates: () => set(initialAppState),
}));

// ---- Common ----
type sTypes = string | boolean | number;
interface CommonStates {
  states: Map<string, sTypes>;
  setState: (key: string, val: sTypes) => void;
  resetCommonStates: () => void;
}

const initialCommonStates = {
  states: new Map<string, sTypes>([
    [StateVariables.AUTHORIZED, false],
    [StateVariables.SYNCED_SESSION, false],
    [StateVariables.SHOW_PROFILE_PANEL, false],
  ]),
};

export const stateCommon = create<CommonStates>((set) => ({
  ...initialCommonStates,
  setState: (key: string, val: sTypes) =>
    set((state) => {
      const next = new Map<string, sTypes>(state.states);
      next.set(key, val);
      return { states: next };
    }),
  resetCommonStates: () => set(initialCommonStates),
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
  resetSearchResult: () => void;
}

const initialSearchState = {
  searchQuery: "",
  showSearchResults: false,
  Users: [],
};

export const searchResult = create<SearchResult>((set) => ({
  ...initialSearchState,
  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setShowSearchResults: (val: boolean) => set({ showSearchResults: val }),
  setUsers: (users: Audience[]) => set({ Users: users }),
  addtoUsers: (newUsers: Audience[]) =>
    set((state) => ({ Users: [...state.Users, ...newUsers] })),
  resetSearchResult: () => set(initialSearchState),
}));
