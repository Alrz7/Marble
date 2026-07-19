import { create } from "zustand";
import { Notification, NotifType } from "@internal/intrCmnTypes";

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

export async function addNewNotification(
  type: NotifType,
  key: string,
  content: string,
  timeOut?: number,
) {
  const { addNotification } = notifState.getState();
  const newNotif: Notification = {
    type: type,
    key: key,
    message: content,
  };
  if (timeOut != undefined) newNotif.timeOut = timeOut;
  addNotification(newNotif);
}
