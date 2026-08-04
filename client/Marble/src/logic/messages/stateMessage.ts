import { create } from "zustand";
import { Message } from "@internal/intrCmnTypes";

interface MessageState {
  messages: Map<number, Message>;
  setMessages: (list: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (oldId: number, next: Message) => void;
  deleteMessage: (id: number) => void;
  resetMessageStates: () => void;
}

const initialMessageState = {
  messages: new Map<number, Message>(),
};

export const messageState = create<MessageState>((set) => ({
  ...initialMessageState,
  setMessages: (list: Message[]) =>
    set(() => {
      const newMessages = new Map<number, Message>();
      for (const s of list) {
        newMessages.set(Number(s.id), s);
      }
      return {
        messages: newMessages,
      };
    }),

  addMessage: (message: Message) =>
    set((state) => {
      const nextGen = new Map(state.messages);
      nextGen.set(Number(message.id), message);
      return { messages: nextGen };
    }),

  updateMessage: (oldId: number, next: Message) =>
    set((state) => {
      const newGen = new Map(state.messages);
      const safeOldId = Number(oldId);
      const safeNextId = Number(next.id);

      if (safeOldId !== safeNextId) {
        newGen.delete(safeOldId);
      }

      newGen.set(safeNextId, next);

      return {
        messages: newGen,
      };
    }),

  deleteMessage: (id: number) =>
    set((state) => {
      const newGen = new Map(state.messages);
      newGen.delete(Number(id));
      return {
        messages: newGen,
      };
    }),
  resetMessageStates: () => set( initialMessageState ),
}));
