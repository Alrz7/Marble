// App.tsx
import { useEffect, useRef, useState } from "react";
import ChatLayout from "./components/chatlayout";
import Login from "./components/login";
import SignUp from "./components/signUp";
import "./App.css";
import LoadingPage from "./components/loadingPage";
import {
  User,
  auth,
} from "./logic/internal/commonTypes";
import { loadConfig } from "./logic/appMain";
import { logOut } from "./logic/auth/login";
import { openConnection, setHandlers } from "./logic/active/actWebsocket";
import { MessageProps } from "./logic/internal/commonTypes";
export default function App() {
  const [loadingPage, setLoadingPage] = useState<boolean>(true);
  const [user, setUserData] = useState<User | null>(null);
  const [authPage, setAuthPage] = useState<auth>("login");
  const [messages, setMessages] = useState<MessageProps[]>([]);
  //   [
  //   {
  //     id: "1",
  //     content: "Hi, how you doing mate?",
  //     sender: "audience",
  //     timestamp: new Date("2025-04-10T10:30:00"),
  //     status: "read",
  //     senderName: "bob",
  //   },
  //   {
  //     id: "2",
  //     content: "Wussup!, I'm doing great What about you",
  //     sender: "user",
  //     timestamp: new Date("2025-04-10T10:32:30"),
  //     status: "read",
  //     senderName: "bob",
  //   },
  //   {
  //     id: "3",
  //     content: "Have you heart of the new Messager app thats Commin out?",
  //     sender: "audience",
  //     timestamp: new Date("2025-04-10T10:34:24"),
  //     status: "read",
  //     senderName: "bob",
  //   },
  //   {
  //     id: "4",
  //     content: "I have!!!, it's going to be the GOAT",
  //     sender: "user",
  //     timestamp: new Date("2025-04-10T10:37:06"),
  //     status: "read",
  //   },
  // ]

  useEffect(() => {
    async function load() {
      const userData = await loadConfig();
      if (userData) {
        setUserData(userData);
        openConnection();
        setHandlers(handlersRef.current);
      }
      setLoadingPage(false);
    }
    load();
  }, []);

  const handlersRef = useRef({
    sessions: (body: any) => {
      // setMessages((prev) => [...prev, body.message]);
    },
    // notifications: (body: any) => { ... },
  });

  const handleBack = () => {
    logOut(setUserData);
  };

  return (
    <div className="chat-app">
      {user && !loadingPage ? (
        <ChatLayout
          user={user}
          onBack={handleBack}
          messages={messages}
          setMessages={setMessages}
        />
      ) : loadingPage ? (
        <LoadingPage />
      ) : authPage == "login" ? (
        <Login setAuth={setAuthPage} setUserData={setUserData} />
      ) : authPage == "signup" ? (
        <SignUp setAuth={setAuthPage} setUserData={setUserData} />
      ) : (
        ""
      )}
    </div>
  );
}
