import React from "react";
import {
  Audience,
  Message,
  Session,
  User,
} from "./commonTypes";

// ----- Tsx Set* -----
export type tpSetMessage = React.Dispatch<React.SetStateAction<Message[]>>;
export type tpSetNewSession = (beta: Audience) => void;
export type tpSetCurrnetSession = (
  beta: Audience,
) => void;

// ---- tsx Props ----
export interface ChatLayoutProps {
  user: User;
  onBack: () => void | null;
  messages: Message[] | null;
  setMessages: tpSetMessage;
}

export type setCurSessionProps = {
  audience: Audience;
  setSession: React.Dispatch<React.SetStateAction<Session | null>>;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
};

export interface SessionsProps {
  user: User;
  setCurrnetSession: tpSetCurrnetSession;
  // setUserData: React.Dispatch<React.SetStateAction<User | null>>;
}
