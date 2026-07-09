import { create } from "zustand";
import { Message, Session } from "../internal/commonTypes";

interface SessionsState {
  sessionlist: Session[];
  currentSession: Session | null;
  setSessionList: (list: Session[]) => void;
  addSession: (essions: Session) => void;
  setCurrentSession: (newsession: Session | null) => void;
}

export const sessionsState = create<SessionsState>((set) => ({
  sessionlist: [],
  currentSession: null,
  setSessionList: (list: Session[]) => set({ sessionlist: list }),
  addSession: (sessions: Session) =>
    set((state) => ({ sessionlist: [...state.sessionlist, sessions] })),
  setCurrentSession: (newsession: Session | null) =>
    set({ currentSession: newsession }),
}));

interface MessageStates {
  Messagelist: Message[];
  setMessages: (messages: Message[]) => void;
  addMessage: (newMessage: Message) => void;
}
export const Messages = create<MessageStates>((set) => ({
  Messagelist: [],
  setMessages: (messages: Message[]) => set({ Messagelist: messages }),
  addMessage: (newMessage: Message) =>
    set((state) => ({ Messagelist: [...state.Messagelist, newMessage] })),
}));

export function reserveSessionId(): number {
  const { sessionlist } = sessionsState.getState();
  const existingIds = sessionlist.filter((s) => s.id < 0).map((s) => s.id);
  return (existingIds.length ? Math.min(...existingIds) : 0) - 1;
}
