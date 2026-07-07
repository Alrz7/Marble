import { useState, useRef } from "react";
import { Send, Paperclip, Smile } from "lucide-react";
import { Messages, sessionsState } from "../../logic/states/sessionStates";
import { Message } from "../../logic/internal/commonTypes";
import { AppUser } from "../../logic/states/userMainStates";
import {
  onCreateNewSession,
  onSendMessage,
} from "../../logic/active/actSessionHandlers";

export default function ChatInput() {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { currentUser } = AppUser();
  const { currentSession } = sessionsState();
  const { Messagelist, addMessage } = Messages();

  /**
   *
   * @param // initiate newMessage -> look for curent session -> onStage ? onCreateNewSession : send PrepareNewMessage
   * @returns
   */
  const PrepareNewMessage = (content: string) => {
    if (!currentUser?.config || !currentSession) return;
    let lastId = Messagelist.at(-1)?.id;
    const newMessage: Message = {
      id: lastId ? lastId++ : 0,
      seq: -1,
      sessionId: currentSession.id,
      content,
      senderId: currentUser?.config.id,
      timestamp: new Date(),
      status: "sent",
    };

    if (currentSession?.onCreateStage) {
      onCreateNewSession(currentSession.audience, newMessage);
    } else {
      onSendMessage(currentSession, currentUser.MasterKey, newMessage);
    }

    addMessage(Messagelist, newMessage);
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

  const handleAttach = () => {
    // Implement file attachment logic
  };

  const handleEmoji = () => {
    // Implement emoji picker logic
  };

  return (
    <div className="border-t border-border bg-background p-4">
      <div className="flex gap-3">
        {/* Attachment Button */}
        <button
          onClick={handleAttach}
          className="p-2.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
          title="Attach file"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        {/* Input Container */}
        <div className="flex-1 bg-secondary rounded-lg px-4 py-2 flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder="Type a message..."
            className="flex-1 bg-transparent text-foreground placeholder-muted-foreground resize-none outline-none max-h-30 text-sm"
            rows={1}
          />

          {/* Emoji Button */}
          <button
            onClick={handleEmoji}
            className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
            title="Add emoji"
          >
            <Smile className="w-5 h-5" />
          </button>
        </div>

        {/* Send Button */}
        <button
          onClick={onSend}
          disabled={!message.trim()}
          className="p-2.5 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-primary-foreground flex-shrink-0"
          title="Send message"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
