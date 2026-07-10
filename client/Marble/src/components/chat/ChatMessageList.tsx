import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import { Messages, sessionsState } from "../../logic/states/sessionStates";
import { loadSavedMessages } from "../../logic/active/actMessageHandlers";

export default function ChatMessageList() {
  const { currentSessionId, sessions } = sessionsState();
  const { Messagelist, setMessages } = Messages();

  async function loadMessages() {
    const messages = (await loadSavedMessages()) ?? [];
    setMessages(messages);
  }

  useEffect(() => {
    loadMessages();
  }, [currentSessionId]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [Messagelist]);

  return (
    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
      {Messagelist.length === 0 ? (
        <div className="flex items-center justify-center h-full text-center">
          <div>
            <p className="text-muted-foreground text-sm mb-2">
              No messages yet
            </p>
            <p className="text-xs text-muted-foreground">
              Start the conversation!
            </p>
          </div>
        </div>
      ) : (
        Messagelist.map((message) => (
          <MessageBubble key={message.seq} message={message} />
        ))
      )}

      {/* {isTyping && <TypingIndicator senderName="John " />} */}
      {false && (
        <TypingIndicator
          senderName={sessions.get(currentSessionId)?.audience.name}
        />
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
