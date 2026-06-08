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

// ---- Notifications ----

interface NotifState {
  notifQueue: Notification[];
  currentNotif: Notification | null;
  setNotification: (notifList: Notification[]) => void;
  setCurrentNotif: (notif: Notification | null) => void;
  addNotification: (
    origin: Notification[],
    notif: Notification,
  ) => Notification[];
  popNotification: (notifQueue: Notification[]) => void;
}

export const notifState = create<NotifState>((set) => ({
  notifQueue: [],
  currentNotif: null,
  setNotification: (notifList: Notification[]) =>
    set({ notifQueue: notifList }),
  setCurrentNotif: (notif: Notification | null) => set({ currentNotif: notif }),
  addNotification: (origin: Notification[], notif: Notification) => {
    set({ notifQueue: [...origin, notif] });
    return [...origin, notif];
  },
  popNotification: (notifQueue: Notification[]) =>
    set({ notifQueue: notifQueue.slice(1) }),
}));
