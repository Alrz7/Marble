import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import { sessionsState } from "@sessions/sessionStates";
import { loadSavedMessages } from "@messages/msgMain";
import { Message } from "@internal/intrCmnTypes";
import { messageState } from "@messages/stateMessage";

export default function ChatMessageList() {
  const { currentSessionId, sessions } = sessionsState();
  const { Messagelist, setMessages } = messageState();

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
  }, [Messagelist]);

  return (
    <div
      ref={scrollContainerRef}
      className="relative z-10 flex-1 min-h-0 overflow-y-auto px-6 pt-24 pb-6 space-y-3 marble-scrollbar"
    >
      {Messagelist.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center gap-1">
          <p className="text-muted-foreground text-sm">No messages yet</p>
          <p className="text-xs text-muted-foreground/60">
            Start the conversation!
          </p>
        </div>
      ) : (
        Messagelist.map((message) => (
          <MessageBubble key={message.seq} message={message} />
        ))
      )}

      {false && (
        <TypingIndicator
          senderName={sessions.get(currentSessionId)?.audience.name}
        />
      )}
    </div>
  );
}
