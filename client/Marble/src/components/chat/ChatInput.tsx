import { useState, useRef } from "react";
import { Send, Paperclip, Smile } from "lucide-react";
import { sessionsState } from "@sessions/sessionStates";
import { Message } from "@internal/intrCmnTypes";
import { AppUser } from "@states/userMainStates";
import { onCreateNewSession } from "@sessions/sessionMain";
import { messageState } from "@messages/stateMessage";
import { onSendNewMessage } from "@messages/msgMain";

export default function ChatInput() {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { currentUser } = AppUser();
  const { currentSessionId, sessions } = sessionsState();
  const curSession = sessions.get(currentSessionId);
  const { messages } = messageState();
  const messagesArray = Array.from(messages.values());

  const PrepareNewMessage = (content: string) => {
    if (!curSession || !currentUser) return;
    let lastId = messagesArray.at(-1)?.id;
    const newMessage: Message = {
      id: lastId ? lastId++ : 0,
      seq: -1,
      sessionId: curSession.id,
      content,
      senderId: currentUser?.config.id,
      createdAt: new Date(),
      profile: "openpgp",
      status: "sending",
    };

    if (curSession?.onCreateStage) {
      onCreateNewSession(newMessage);
    } else {
      onSendNewMessage(newMessage);
    }

    // addMessage(newMessage);
  };

  const onSend = () => {
    if (message.trim()) {
      PrepareNewMessage(message);
      setMessage("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handleInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const handleAttach = () => {};

  const handleEmoji = () => {};

  return (
    <div className="relative z-10 px-6 pb-6 pt-2">
      <div className="flex items-end gap-2 glass-panel rounded-2xl px-3 py-2.5">
        <button
          onClick={handleAttach}
          className="p-2 rounded-xl hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground shrink-0"
          title="Attach file"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder="Type a message..."
          className="flex-1 bg-transparent text-foreground placeholder-muted-foreground resize-none outline-none max-h-32 text-sm py-1.5"
          rows={1}
        />

        <button
          onClick={handleEmoji}
          className="p-2 rounded-xl hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground shrink-0"
          title="Add emoji"
        >
          <Smile className="w-5 h-5" />
        </button>

        <button
          onClick={onSend}
          disabled={!message.trim()}
          className="p-2.5 rounded-xl bg-primary hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-primary-foreground shrink-0"
          title="Send message"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
