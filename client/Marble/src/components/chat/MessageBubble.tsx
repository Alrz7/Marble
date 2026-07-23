import { useState } from "react";
import {
  Copy,
  Trash2,
  Check,
  CheckCheck,
  CloudAlert,
  RotateCcw,
} from "lucide-react";
import { Message } from "@internal/intrCmnTypes";
import { AppUser } from "@states/userMainStates";
import { sessionsState } from "@sessions/sessionStates";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { notifState } from "@states/stateNotif";
import { DeleteMessage } from "@messages/actMessageHandlers";
import { onResendMessage } from "@messages/msgMain";

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const { currentSessionId, sessions } = sessionsState();
  const { currentUser } = AppUser();
  const { addNotification } = notifState();

  const handleCopy = async () => {
    await writeText(message.content);
    addNotification({
      type: "success",
      key: "clipboard",
      message: "Message copied to clipboard!",
      timeOut: 1000,
    });
  };
  // const handleReply = () => {};
  // const handleEdit = () => {};
  const handleDelete = () => {
    DeleteMessage(message);
  };

  const getStatusIcon = () => {
    if (!currentUser || !(message.senderId == currentUser.config.id))
      return null;

    switch (message.status) {
      case "sent":
        return <Check className="w-3.5 h-3.5 text-muted-foreground" />;
      case "delivered":
        return <CheckCheck className="w-3.5 h-3.5 text-muted-foreground" />;
      case "read":
        return <CheckCheck className="w-3.5 h-3.5 text-primary" />;
      case "notSend":
        return <CloudAlert className="w-4 h-4 text-night-bordeaux-400" />;
      default:
        return null;
    }
  };

  const isMine = message.senderId == currentUser?.config.id;
  const audienceName = sessions.get(currentSessionId)?.audience.name;

  return (
    <div
      className={`flex gap-3 group animate-fade-in ${isMine ? "flex-row-reverse" : "flex-row"}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {!isMine && (
        <div className="w-8 h-8 bg-linear-to-br from-primary to-accent rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">
          {audienceName}
        </div>
      )}

      <div
        className={`flex flex-col gap-1 ${isMine ? "items-end" : "items-start"}`}
      >
        {!isMine && (
          <span className="text-xs font-medium text-muted-foreground pl-3">
            {audienceName}
          </span>
        )}

        <div
          className={`rounded-2xl px-4 py-2.5 max-w-xs shadow-sm ${
            isMine
              ? "bg-gray-600 text-primary-foreground"
              : "glass-panel text-foreground"
          }`}
        >
          <p className="text-sm wrap-break-word">{message.content}</p>
        </div>

        <div
          className={`flex items-center gap-2 text-xs text-muted-foreground px-3 ${
            isMine ? "flex-row-reverse" : "flex-row"
          }`}
        >
          {isMine ? (
            <>
              {getStatusIcon()}
              <span className="text-muted-foreground/60">
                {message.createdAt.toLocaleString()}
              </span>
            </>
          ) : (
            <>
              <span className="text-muted-foreground/60">
                {message.createdAt.toLocaleString()}
              </span>
              {getStatusIcon()}
            </>
          )}
        </div>
      </div>

      {showActions && (
        <div
          className={`flex gap-1 items-center ${isMine ? "flex-row-reverse" : "flex-row"}`}
        >
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground"
            title="Copy"
          >
            <Copy className="w-4 h-4" />
          </button>
          {/* <button
            onClick={handleReply}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground"
            title="Reply"
          >
            <Reply className="w-4 h-4" />
          </button> */}
          <button
            onClick={handleDelete}
            className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          {true && (
            <>
              {/* <button
                onClick={handleEdit}
                className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground"
                title="Edit"
              >
                <Edit2 className="w-4 h-4" />
              </button> */}
              {message.status == "notSend" && (
                <button
                  onClick={()=>{onResendMessage(message)}}
                  className="p-1.5 rounded-lg hover:bg-yale-blue-800/40 transition-colors text-muted-foreground hover:text-yale-blue-500"
                  title="Resend"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
