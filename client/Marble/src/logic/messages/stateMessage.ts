import { create } from "zustand";
import { Message } from "@internal/commonTypes";

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
