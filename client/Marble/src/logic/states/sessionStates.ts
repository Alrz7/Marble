import { create } from "zustand";
import { Message, Session } from "../internal/commonTypes";

interface SessionsState {
  sessions: Map<number, Session>; // Map<session.id, session>
  currentSessionId: number;
  setSessions: (list: Session[]) => void;
  addSession: (session: Session) => void;
  updateSession: (oldId: number, next: Session) => void;
  UpdateCurrentSession: (next: Session) => void;
  setCurrentSessionId: (id: number) => void;
  deleteSession: (id: number) => void;
}

export const sessionsState = create<SessionsState>((set) => ({
  sessions: new Map<number, Session>([]),
  currentSessionId: 0,
  setSessions: (list: Session[]) =>
    set(() => {
      const newSessions = new Map();
      for (const s of list) {
        newSessions.set(s.id, s);
      }
      return {
        sessions: newSessions,
      };
    }),
  addSession: (session: Session) =>
    set((state) => {
      const next = new Map(state.sessions);
      next.set(session.id, session);
      return { sessions: next };
    }),
  updateSession: (oldId: number, next: Session) =>
    set((state) => {
      const newGen = new Map(state.sessions);
      const old = newGen.get(oldId);
      if (!old) return state;
      newGen.delete(oldId);
      newGen.set(next.id, next);
      return {
        sessions: newGen,
      };
    }),
  UpdateCurrentSession: (next: Session) =>
    set((state) => {
      const newGen = new Map(state.sessions);
      newGen.delete(state.currentSessionId);
      newGen.set(next.id, next);
      return {
        sessions: newGen,
        currentSessionId: next.id,
      };
    }),
  setCurrentSessionId: (id: number) => set({ currentSessionId: id }),
  deleteSession: (id: number) =>
    set((state) => {
      const newGen = new Map(state.sessions);
      newGen.delete(id);
      let newCurId = state.currentSessionId;
      if (id == state.currentSessionId) {
        newCurId = 0;
      }
      return {
        sessions: newGen,
        currentSessionId: newCurId,
      };
    }),
}));

interface MessageStates {
  Messagelist: Message[];
  setMessages: (messages: Message[]) => void;
  addMessage: (newMessage: Message) => void;
  DeleteMessage: (indx: number) => void;
}
export const messageState = create<MessageStates>((set) => ({
  Messagelist: [],
  setMessages: (messages: Message[]) => set({ Messagelist: messages }),
  addMessage: (newMessage: Message) =>
    set((state) => ({ Messagelist: [...state.Messagelist, newMessage] })),
  DeleteMessage: (indx: number) =>
    set((state) => {
      const newGen = state.Messagelist.toSpliced(indx, 1);
      return { Messagelist: newGen };
    }),
}));

export function reserveSessionId(): number {
  const { sessions } = sessionsState.getState();
  const existingIds = [...sessions.values()]
    .filter((s) => s.id < 0)
    .map((s) => s.id);
  return (existingIds.length ? Math.min(...existingIds) : 0) - 1;
}
