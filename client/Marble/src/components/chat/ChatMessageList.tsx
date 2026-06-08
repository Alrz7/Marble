import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import { Messages, sessionsState } from "../../logic/states/sessionStates";
import { loadSavedMessages } from "../../logic/active/actSessionHandlers";
import { AppUser } from "../../logic/states/userMainStates";

export default function ChatMessageList() {
  const { currentSession } = sessionsState();
  const { Messagelist, setMessages } = Messages();
  const { currentUser } = AppUser();

  async function loadMessages() {
    if (!currentUser || !currentUser.config || !currentSession) return;
    const messages =
      (await loadSavedMessages(
        currentUser.config.storeKey,
        currentSession.storageId,
      )) ?? [];
    setMessages(messages);
  }

  useEffect(() => {
    loadMessages();
  }, [currentSession]);

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
          <MessageBubble key={message.id} message={message} />
        ))
      )}

      {/* {isTyping && <TypingIndicator senderName="John " />} */}
      {false && <TypingIndicator senderName={currentSession?.beta.name} />}

      <div ref={messagesEndRef} />
    </div>
  );
}
