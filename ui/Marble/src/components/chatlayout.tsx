// ChatLayout.tsx
import React, { useState, useRef, useEffect } from "react";
import Message, { MessageProps } from "./message";
import ChatInput from "./chatInput";
import ChatHeader from "./chatHeader";
import Sessions from "./sessions";
import "./styles/chatLayout.css";
import { User } from "../logic/internal/commonTtypes";
import SearchBar from "./searchBar";

export interface ChatLayoutProps {
  user: User;
  onBack: () => void;
}
const ChatLayout: React.FC<ChatLayoutProps> = ({ user, onBack }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [messages, setMessages] = useState<MessageProps[]>([
    // {
    //   id: "1",
    //   content: "Hi, how you doing mate?",
    //   sender: "audience",
    //   timestamp: new Date("2025-04-10T10:30:00"),
    //   status: "read",
    //   senderName: "bob",
    // },
    // {
    //   id: "2",
    //   content: "Wussup!, I'm doing great What about you",
    //   sender: "user",
    //   timestamp: new Date("2025-04-10T10:32:30"),
    //   status: "read",
    // },
    // {
    //   id: "3",
    //   content: "Have you heart of the new Messager app thats Commin out?",
    //   sender: "audience",
    //   timestamp: new Date("2025-04-10T10:34:24"),
    //   status: "read",
    //   senderName: "bob",
    // },
    // {
    //   id: "4",
    //   content: "I have!!!, it's going to be the GOAT",
    //   sender: "user",
    //   timestamp: new Date("2025-04-10T10:37:06"),
    //   status: "read",
    // },
  ]);

  async function onSendMessage(content: string) {}

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    setMessages(messages);
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    const tempMessage: MessageProps = {
      id: `temp-${Date.now()}`,
      content,
      sender: "user",
      timestamp: new Date(),
      status: "sent",
    };

    // Add temporary message immediately
    setMessages((prev) => [...prev, tempMessage]);

    try {
      await onSendMessage(content);

      // Update message status after successful send
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempMessage.id
            ? { ...msg, status: "delivered" as const }
            : msg,
        ),
      );
    } catch (error) {
      console.error("Failed to send message:", error);
      // You could show an error state here
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Group messages by date
  const groupedMessages = messages.reduce(
    (groups, message) => {
      const date = formatDate(message.timestamp);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
      return groups;
    },
    {} as Record<string, MessageProps[]>,
  );

  return (
    <div className="chat-layout">
      <div className="chat-sidebar">
        <ChatHeader
          onBack={onBack}
          user={user}
          isSearching={isSearching}
          searchToggle={() => setIsSearching((prev) => !prev)}
        />
        {isSearching ? <SearchBar /> : <Sessions user={user} />}
      </div>

      <div className="chat-main">
        <div className="messages-container">
          {Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <React.Fragment key={date}>
              <div
                style={{
                  textAlign: "center",
                  margin: "20px 0",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    display: "inline-block",
                    padding: "6px 16px",
                    backgroundColor: "rgba(80, 80, 80, 0.15)",
                    borderRadius: "20px",
                    fontFamily: "Crf-reg",
                    fontSize: "12px",
                    color: "#fdfeffff",
                    border: "1px solid rgba(123, 97, 255, 0)",
                    backdropFilter: "blur(5px)",
                  }}
                >
                  {date}
                </div>
              </div>

              {dateMessages.map((message) => (
                <Message
                  key={message.id}
                  {...message}
                  senderName={
                    message.sender === "audience"
                      ? "audience"
                      : user.config.name
                  }
                />
              ))}
            </React.Fragment>
          ))}

          {
            /* // {true && ( */
            //   <div
            //     className="message message-audience"
            //     style={{ alignSelf: "flex-start" }}
            //   >
            //     <div
            //       className="message-content"
            //       style={{ display: "flex", alignItems: "center", gap: "8px" }}
            //     >
            //       <div
            //         style={{
            //           width: "20px",
            //           height: "20px",
            //           border: "2px solid rgba(46, 183, 204, 0.3)",
            //           borderTopColor: "#ffffff",
            //           borderRadius: "50%",
            //           animation: "spin 1s linear infinite",
            //         }}
            //       />
            //       typing...
            //     </div>
            //     <style>{`
            //       @keyframes spin {
            //         0% { transform: rotate(0deg); }
            //         100% { transform: rotate(360deg); }
            //       }
            //     `}</style>
            //   </div>
            // )
          }

          <div ref={messagesEndRef} />
        </div>

        <ChatInput
          onSendMessage={handleSendMessage}
          placeholder="Message"
          // disabled={isLoading}
        />
      </div>
    </div>
  );
};

export default ChatLayout;
