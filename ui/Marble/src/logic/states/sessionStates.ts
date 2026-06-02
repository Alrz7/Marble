import { create } from "zustand";
import { MessageProps } from "../internal/commonTypes";

interface SessionState {
  messages: MessageProps[];
  currentSession: string | null;
  addMessage: (msg: MessageProps) => void;
  setCurrentSession: (id: string) => void;
}

export const useChatStore = create<SessionState>((set) => ({
  messages: [],
  currentSession: null,
  addMessage: (msg) =>
    set((state) => ({
      messages: [...state.messages, msg],
    })),
  setCurrentSession: (id) => set({ currentSession: id }),
}));
