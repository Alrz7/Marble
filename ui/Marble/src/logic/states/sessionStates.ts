import { create } from "zustand";
import { MessageProps, Session } from "../internal/commonTypes";

interface SessionsState {
  sessionlist: Session[];
  currentSession: Session | null;
  setSessionList: (list: Session[]) => void;
  addSessions: (origin: Session[], sessions: Session[]) => void;
  setCurrentSession: (newsession: Session | null) => void;
}

export const sessionsState = create<SessionsState>((set) => ({
  sessionlist: [],
  currentSession: null,
  setSessionList: (list: Session[]) => set({ sessionlist: list }),
  addSessions: (origin: Session[], sessions: Session[]) =>
    set({ sessionlist: [...origin, ...sessions] }),
  setCurrentSession: (newsession: Session | null) =>
    set({ currentSession: newsession }),
}));

interface MessageStates {
  Messagelist: MessageProps[];
  setMessages: (users: MessageProps[]) => void;
  addMessage: (origin: MessageProps[], newMessage: MessageProps) => void;
}
export const Messages = create<MessageStates>((set) => ({
  Messagelist: [],
  setMessages: (messages: MessageProps[]) => set({ Messagelist: messages }),
  addMessage: (origin: MessageProps[], newMessage: MessageProps) =>
    set({ Messagelist: [...origin, newMessage] }),
}));
