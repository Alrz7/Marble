import { create } from "zustand";
import { Session } from "../internal/commonTypes";

interface SessionsState {
  sessionlist: Session[];
  setSessionList: (list: Session[]) => void;
  addSessions: (origin: Session[], sessions: Session[]) => void;
}

export const sessionsState = create<SessionsState>((set) => ({
  sessionlist: [],
  setSessionList: (list: Session[]) => set({ sessionlist: list }),
  addSessions: (origin: Session[], sessions: Session[]) =>
    set({ sessionlist: [...origin, ...sessions] }),
}));
