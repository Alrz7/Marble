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
  Users: Audience[];
  setUsers: (users: Audience[]) => void;
  addtoUsers: (newUsers: Audience[]) => void;
}
export const searchResult = create<SearchResult>((set) => ({
  Users: [],
  setUsers: (users: Audience[]) => set({ Users: users }),
  addtoUsers: (newUsers: Audience[]) =>
    set((state) => ({ Users: [...state.Users, ...newUsers] })),
}));

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
