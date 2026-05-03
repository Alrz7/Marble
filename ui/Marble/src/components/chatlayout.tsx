// ChatLayout.tsx
import React, { useState, useRef, useEffect } from "react";
import Message, { MessageProps } from "./message";
import ChatInput from "./chatInput";
import ChatHeader from "./chatHeader";
import "./styles/chatLayout.css";

export interface ChatLayoutProps {
  onSendMessage: (message: string) => Promise<void>;
  messages: MessageProps[];
  currentUser: {
    name: string;
    status: string;
    avatar?: string;
  };
  onBack?: () => void;
  isLoading?: boolean;
}

const ChatLayout: React.FC<ChatLayoutProps> = ({
  onSendMessage,
  messages,
  currentUser,
  onBack = () => console.log("Back clicked"),
  isLoading = false,
}) => {
  const [localMessages, setLocalMessages] = useState<MessageProps[]>(messages);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [localMessages]);

  useEffect(() => {
    setLocalMessages(messages);
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
    setLocalMessages((prev) => [...prev, tempMessage]);

    try {
      await onSendMessage(content);

      // Update message status after successful send
      setLocalMessages((prev) =>
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
  const groupedMessages = localMessages.reduce(
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
          userName={currentUser.name}
          userStatus={currentUser.status}
          userAvatar={currentUser.avatar}
        />

        {/* Additional sidebar content can go here */}
        {/* <div
          style={{
            padding: "20px",
            color: "rgba(230, 230, 230, 0.6)",
            fontSize: "14px",
            borderTop: "1px solid rgba(123, 97, 255, 0.1)",
            marginTop: "auto",
          }}
        >
          <p style={{ fontSize: "12px", marginTop: "8px" }}>
          </p>
        </div> */}
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
                    message.sender === "audience" ? currentUser.name : undefined
                  }
                />
              ))}
            </React.Fragment>
          ))}

          {isLoading && (
            <div
              className="message message-audience"
              style={{ alignSelf: "flex-start" }}
            >
              <div
                className="message-content"
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    border: "2px solid rgba(46, 183, 204, 0.3)",
                    borderTopColor: "#ffffff",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                />
                typing...
              </div>
              <style>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <ChatInput
          onSendMessage={handleSendMessage}
          placeholder="Message"
          disabled={isLoading}
        />
      </div>
    </div>
  );
};

export default ChatLayout;
