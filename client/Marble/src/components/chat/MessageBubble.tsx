import { useState } from "react";
import { Copy, Reply, Edit2, Trash2, Check, CheckCheck } from "lucide-react";
import { Message } from "../../logic/internal/commonTypes";
import { AppUser } from "../../logic/states/userMainStates";

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const { currentUser } = AppUser();

  const handleCopy = () => {};
  const handleReply = () => {};
  const handleEdit = () => {};
  const handleDelete = () => {};

  const getStatusIcon = () => {
    if (!currentUser || !(message.senderId == currentUser.config.id)) return null;

    switch (message.status) {
      case "sent":
        return <Check className="w-3.5 h-3.5 text-muted-foreground" />;
      case "delivered":
        return <CheckCheck className="w-3.5 h-3.5 text-muted-foreground" />;
      case "read":
        return <CheckCheck className="w-3.5 h-3.5 text-primary" />;
      default:
        return null;
    }
  };

  const isMine = message.senderId == currentUser?.config.id;

  return (
    <div
      className={`flex gap-3 group animate-fade-in ${isMine ? "flex-row-reverse" : "flex-row"}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {!isMine && (
        <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">
          {message.senderId}
        </div>
      )}

      <div className={`flex flex-col gap-1 ${isMine ? "items-end" : "items-start"}`}>
        {!isMine && <span className="text-xs font-medium text-muted-foreground pl-3">{message.senderId}</span>}

        <div
          className={`rounded-2xl px-4 py-2.5 max-w-xs shadow-sm ${
            isMine ? "bg-primary text-primary-foreground" : "glass-panel text-foreground"
          }`}
        >
          <p className="text-sm break-words">{message.content}</p>
        </div>

        <div
          className={`flex items-center gap-2 text-xs text-muted-foreground px-3 ${
            isMine ? "flex-row-reverse" : "flex-row"
          }`}
        >
          {getStatusIcon()}
        </div>
      </div>

      {showActions && (
        <div className={`flex gap-1 items-center ${isMine ? "flex-row-reverse" : "flex-row"}`}>
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground"
            title="Copy"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={handleReply}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground"
            title="Reply"
          >
            <Reply className="w-4 h-4" />
          </button>
          {isMine && (
            <>
              <button
                onClick={handleEdit}
                className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground"
                title="Edit"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleDelete}
                className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
