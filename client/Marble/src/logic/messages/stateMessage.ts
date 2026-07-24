import { create } from "zustand";
import { Message } from "@internal/intrCmnTypes";

interface MessageStates {
  Messagelist: Message[];
  setMessages: (messages: Message[]) => void;
  addMessage: (newMessage: Message) => void;
  updateMessage: (indx: number, next: Message) => void;
  DeleteMessage: (indx: number) => void;
}

export const messageState = create<MessageStates>((set) => ({
  Messagelist: [],
  setMessages: (messages: Message[]) => set({ Messagelist: messages }),
  addMessage: (newMessage: Message) =>
    set((state) => ({ Messagelist: [...state.Messagelist, newMessage] })),
  updateMessage: (indx: number, next: Message) =>
    set((state) => {
      const newGen = state.Messagelist.toSpliced(indx, 1, next);
      return { Messagelist: newGen };
    }),
  DeleteMessage: (indx: number) =>
    set((state) => {
      const newGen = state.Messagelist.toSpliced(indx, 1);
      return { Messagelist: newGen };
    }),
}));