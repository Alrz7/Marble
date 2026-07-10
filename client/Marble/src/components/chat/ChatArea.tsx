import ChatHeader from "./ChatHeader";
import ChatMessageList from "./ChatMessageList";
import ChatInput from "./ChatInput";
import { sessionsState } from "../../logic/states/sessionStates";

export default function ChatArea() {
  const { currentSessionId, sessions } = sessionsState();
  const curSession = sessions.get(currentSessionId);
  return (
    <div className="flex flex-col h-full bg-background">
      {curSession ? (
        <>
          <ChatHeader />
          <ChatMessageList />
          <ChatInput />
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500 text-lg font-medium">
          select a chat to start messaging
        </div>
      )}
    </div>
  );
}
