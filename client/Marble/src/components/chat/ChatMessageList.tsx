import React from "react";
import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import { sessionsState } from "@sessions/stateSession";
import { loadSavedMessages } from "@messages/msgMain";
import { Message } from "@internal/intrCmnTypes";
import { messageState } from "@messages/stateMessage";

export default function ChatMessageList() {
  const { currentSessionId, sessions } = sessionsState();
  const { messages, setMessages } = messageState();

  const messagesArray = Array.from(messages.values());

  async function loadMessages() {
    const messages: Message[] | null = await loadSavedMessages();
    if (messages !== null) setMessages(messages);
  }

  useEffect(() => {
    loadMessages();
  }, [currentSessionId]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
    // console.log(messages) // LOG
  }, [messages]);

  return (
    <div
      ref={scrollContainerRef}
      className="relative z-10 flex-1 min-h-0 overflow-y-auto px-6 pt-6 pb-24 space-y-3 marble-scrollbar"
    >
      {messages.size === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center gap-1">
          <p className="text-muted-foreground text-sm">No messages yet</p>
          <p className="text-xs text-muted-foreground/60">
            Start the conversation!
          </p>
        </div>
      ) : (
        messagesArray.map((message, index) => {
          const currentDate = new Date(message.createdAt);
          const msg = messagesArray.at(index - 1);
          const prevDate = index > 0 && msg ? new Date(msg.createdAt) : null;
          const showSeparator =
            !prevDate || currentDate.toDateString() !== prevDate.toDateString();

          return (
            <React.Fragment key={message.seq}>
              {showSeparator && (
                <div className="flex items-center justify-center w-[90%] mx-auto my-6">
                  <div className="flex-1 border-t border-gray-500/30"></div>
                  <span className="mx-4 text-xs font-medium text-gray-500/70 font-['Comfortaa']">
                    {currentDate.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <div className="flex-1 border-t border-gray-500/30"></div>
                </div>
              )}
              <MessageBubble message={message} />
            </React.Fragment>
          );
        })
      )}

      {false && (
        <TypingIndicator
          senderName={sessions.get(currentSessionId)?.audience.name}
        />
      )}
    </div>
  );
}
