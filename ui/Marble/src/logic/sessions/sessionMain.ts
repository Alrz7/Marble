import {
  onSendMessage,
  onSetCreateSession,
} from "../active/actWsClientHandelers";
import { MessageProps, Session } from "../internal/commonTypes";
import { setCurSessionProps } from "../internal/tsxTypes";
import { getStoreSession } from "../store/strMain";

export async function setCurrentSession(props: setCurSessionProps) {
  const newSession: Session = {
    beta: props.audience,
    sessionId: props.audience.sessionId,
  };
  props.setSession(newSession);
  try {
    const messageList = await getStoreSession(props.audience.storageId);
    if (messageList) props.setMessages(messageList);
  } catch (err) {
    console.error(err);
  }
}

export async function handleSessionMessage(
  session: Session | null,
  content: string,
  setMessages: React.Dispatch<React.SetStateAction<MessageProps[]>>,
) {
  if (!session) return;
  const tempMessage: MessageProps = {
    id: `temp-${Date.now()}`,
    content,
    sender: "user",
    timestamp: new Date(),
    status: "sent",
  };
  // Add temporary message immediately
  setMessages((prev) => [...prev, tempMessage]);

  try {
    if (session.sessionId == -1) {
      onSetCreateSession(session.beta, content);
    } else {
      onSendMessage(session, content);
    }

    // Update message status after successful send
    setMessages((prev) =>
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
}
