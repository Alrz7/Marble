import { onSendMessage } from "../active/actWebsocket";
import { GroupSession, MessageProps, Session } from "../internal/commonTypes";
import { getStoreSession } from "../store/strMain";

type setCurSessionProps = {
  beta: string;
  sessionIds: { sessionId: number; storageId: string };
  setSession: React.Dispatch<React.SetStateAction<Session | null>>;
  setMessages: React.Dispatch<React.SetStateAction<MessageProps[]>>;
};

export async function setCurrentSession(props: setCurSessionProps) {
  const newSession: Session = {
    beta: props.beta,
    sessionId: props.sessionIds.sessionId,
  };
  props.setSession(newSession);
  try {
    const messageList = await getStoreSession(props.sessionIds.storageId);
    if (messageList) props.setMessages(messageList);
  } catch (err) {
    console.error(err);
  }
}

export async function handleSessionMessage(
  session: Session | GroupSession | null,
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
    onSendMessage(session.sessionId, content);

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

// export function sendMessage(){

// }

// export function handleSessions(){

// }
