import { create } from "zustand";
import { Audience, Notification } from "../internal/commonTypes";

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
    ["authorized", false],
    ["syncedSession", false],
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

export function ResetSearchPrcs() {
<<<<<<< HEAD
  const { setUsers, setSearchQuery, setShowSearchResults } =
    searchResult.getState();
  setUsers([]);
=======
  const { setSearchQuery, setShowSearchResults } =
    searchResult.getState();
  // setUsers([]);
>>>>>>> temp-recovery
  setSearchQuery("");
  setShowSearchResults(false);
}

// ---- Notifications ----

interface NotifState {
  notifQueue: Notification[];
  currentNotif: Notification | null;
  setNotification: (notifList: Notification[]) => void;
  setCurrentNotif: (notif: Notification | null) => void;
  addNotification: (notif: Notification) => void;
  popNotification: (notifQueue: Notification[]) => void;
}

export const notifState = create<NotifState>((set) => ({
  notifQueue: [],
  currentNotif: null,
  setNotification: (notifList: Notification[]) =>
    set({ notifQueue: notifList }),
  setCurrentNotif: (notif: Notification | null) => set({ currentNotif: notif }),
  addNotification: (notif: Notification) => {
    set((state) => ({ notifQueue: [...state.notifQueue, notif] }));
    return [...origin, notif];
  },
  popNotification: (notifQueue: Notification[]) =>
    set({ notifQueue: notifQueue.slice(1) }),
}));
