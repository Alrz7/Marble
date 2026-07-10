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

  // const formatTime = (date: Date) => {
  //   return date?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  // };

  const handleCopy = () => {};

  const handleReply = () => {
    // Implement reply logic
  };

  const handleEdit = () => {
    // Implement edit logic
  };

  const handleDelete = () => {
    // Implement delete logic
  };

  const getStatusIcon = () => {
    if (!currentUser || !(message.senderId == currentUser.config.id))
      return null;

    switch (message.status) {
      case "sent":
        return <Check className="w-4 h-4 text-muted-foreground" />;
      case "delivered":
        return <CheckCheck className="w-4 h-4 text-muted-foreground" />;
      case "read":
        return <CheckCheck className="w-4 h-4 text-primary" />;
      default:
        return null;
    }
  };

  return (
    <div
      className={`flex gap-3 group ${message.senderId == currentUser?.config.id ? "flex-row-reverse" : "flex-row"}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      {(!currentUser || !(message.senderId == currentUser.config.id)) && (
        <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground flex-shrink-0">
          {message.senderId}
        </div>
      )}

      {/* Message Container */}
      <div
        className={`flex flex-col gap-1 ${message.senderId == currentUser?.config.id ? "items-end" : "items-start"}`}
      >
        {/* Sender Name */}
        {(!currentUser || !(message.senderId == currentUser.config.id)) && (
          <span className="text-xs font-medium text-muted-foreground pl-3">
            {message.senderId}
          </span>
        )}

        {/* Bubble */}
        <div
          className={`rounded-lg px-4 py-2 max-w-xs ${
            message.senderId == currentUser?.config.id
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-foreground"
          }`}
        >
          <p className="text-sm break-words">{message.content}</p>
        </div>

        {/* Time and Status */}
        <div
          className={`flex items-center gap-2 text-xs text-muted-foreground px-3 ${
            message.senderId == currentUser?.config.id
              ? "flex-row-reverse"
              : "flex-row"
          }`}
        >
          {/* <span>{formatTime(message.timestamp)}</span> **this should be checked** */}
          {getStatusIcon()}
        </div>
      </div>

      {/* Action Buttons */}
      {showActions && (
        <div
          className={`flex gap-1 ${message.senderId == currentUser?.config.id ? "flex-row-reverse" : "flex-row"}`}
        >
          <button
            onClick={handleCopy}
            className="p-1.5 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            title="Copy"
          >
            <Copy className="w-4 h-4" />
          </button>

          <button
            onClick={handleReply}
            className="p-1.5 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            title="Reply"
          >
            <Reply className="w-4 h-4" />
          </button>

          {message.senderId == currentUser?.config.id && (
            <>
              <button
                onClick={handleEdit}
                className="p-1.5 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                title="Edit"
              >
                <Edit2 className="w-4 h-4" />
              </button>

              <button
                onClick={handleDelete}
                className="p-1.5 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
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
