import { create } from "zustand";
import { Message } from "@internal/intrCmnTypes";

interface MessageState {
  messages: Map<number, Message>;
  setMessages: (list: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (oldId: number, next: Message) => void;
  deleteMessage: (id: number) => void;
}

export const messageState = create<MessageState>((set) => ({
  messages: new Map<number, Message>(),

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
}));

// interface MessageStates {
//   Messagelist: Message[];
//   setMessages: (messages: Message[]) => void;
//   addMessage: (newMessage: Message) => void;
//   updateMessage: (indx: number, next: Message) => void;
//   DeleteMessage: (indx: number) => void;
// }

// export const messageState = create<MessageStates>((set) => ({
//   Messagelist: [],
//   setMessages: (messages: Message[]) => set({ Messagelist: messages }),
//   addMessage: (newMessage: Message) =>
//     set((state) => ({ Messagelist: [...state.Messagelist, newMessage] })),
//   updateMessage: (indx: number, next: Message) =>
//     set((state) => {
//       const newGen = [...state.Messagelist];
//       newGen[indx] = next;
//       return { Messagelist: newGen };
//     }),
//   DeleteMessage: (indx: number) =>
//     set((state) => {
//       const newGen = state.Messagelist.toSpliced(indx, 1);
//       return { Messagelist: newGen };
//     }),
// }));
