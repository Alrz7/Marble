import { create } from "zustand";
import { Message, Session } from "../internal/commonTypes";

interface SessionsState {
  sessionlist: Session[];
  currentSession: Session | null;
  setSessionList: (list: Session[]) => void;
  addSession: (origin: Session[], sessions: Session) => void;
  setCurrentSession: (newsession: Session | null) => void;
}

export const sessionsState = create<SessionsState>((set) => ({
  sessionlist: [],
  currentSession: null,
  setSessionList: (list: Session[]) => set({ sessionlist: list }),
  addSession: (origin: Session[], sessions: Session) =>
    set({ sessionlist: [...origin, sessions] }),
  setCurrentSession: (newsession: Session | null) =>
    set({ currentSession: newsession }),
}));

interface MessageStates {
  Messagelist: Message[];
  setMessages: (messages: Message[]) => void;
  addMessage: (origin: Message[], newMessage: Message) => void;
}
export const Messages = create<MessageStates>((set) => ({
  Messagelist: [],
  setMessages: (messages: Message[]) => set({ Messagelist: messages }),
  addMessage: (origin: Message[], newMessage: Message) =>
    set({ Messagelist: [...origin, newMessage] }),
}));
