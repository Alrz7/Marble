// App.tsx
// import React, { useState } from "react";
// import ChatLayout from "./components/chatlayout";
// import { MessageProps } from "./components/message";
import Login from "./components/login";
import SignUp from "./components/signUp";

import "./App.css";
import { useState } from "react";
import { auth } from "./components/types";
export default function App() {
  const [authPage, setAuthPage] = useState<auth>("login");
  // const [messages, setMessages] = useState<MessageProps[]>([
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
  // ]);

  // const [isLoading, setIsLoading] = useState(false);

  // const handleSendMessage = async (content: string) => {
  //   // شبیه‌سازی تاخیر در ارسال
  //   setIsLoading(true);

  //   // در اینجا شما می‌توانید API call به backend انجام دهید
  //   await new Promise((resolve) => setTimeout(resolve, 1000));

  //   const newMessage: MessageProps = {
  //     id: Date.now().toString(),
  //     content,
  //     sender: "user" as const,
  //     timestamp: new Date(),
  //     status: "sent",
  //   };

  //   setMessages((prev) => [...prev, newMessage]);
  //   setIsLoading(false);

  //   // شبیه‌سازی پاسخ خودکار
  //   setTimeout(() => {
  //     const autoReply: MessageProps = {
  //       id: (Date.now() + 1).toString(),
  //       content: `پیام شما دریافت شد: "${content}"`,
  //       sender: "audience",
  //       timestamp: new Date(),
  //       status: "delivered",
  //       senderName: "bob",
  //     };
  //     setMessages((prev) => [...prev, autoReply]);
  //   }, 1500);
  // };

  // const handleBack = () => {
  //   console.log("بازگشت به لیست چت‌ها");
  //   // در اینجا می‌توانید navigation logic اضافه کنید
  // };

  return (
    <div className="chat-app">
      {/* <Login /> */}
      {authPage == "login" ? (
        <Login setAuth={setAuthPage} />
      ) : authPage == "signup" ? (
        <SignUp setAuth={setAuthPage} />
      ) : (
        ""
      )}

      {/* <ChatLayout
        onSendMessage={handleSendMessage}
        messages={messages}
        currentUser={{
          name: "bob",
          status: "online",
          avatar: undefined, // می‌توانید URL آواتار قرار دهید
        }}
        onBack={handleBack}
        isLoading={isLoading}
      /> */}
    </div>
  );
}
