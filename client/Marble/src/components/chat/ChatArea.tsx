import ChatHeader from "./ChatHeader";
import ChatMessageList from "./ChatMessageList";
import ChatInput from "./ChatInput";
import { sessionsState } from "../../logic/states/sessionStates";
import { useState } from "react";
import UserProfilePanel from "./UserProfilePanel";

export default function ChatArea() {
  const [showProfile, setShowProfile] = useState(false);
  const { currentSessionId, sessions } = sessionsState();
  const curSession = sessions.get(currentSessionId);
  return (
    <div className="relative flex flex-col h-full bg-background overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-20 w-96 h-96 rounded-full bg-glow-indigo/25 blur-[110px] animate-drift1" />
        <div className="absolute top-20 -right-24 w-96 h-96 rounded-full bg-glow-sage/20 blur-[110px] animate-drift2" />
        <div className="absolute -bottom-24 left-1/3 w-80 h-80 rounded-full bg-glow-clay/15 blur-[110px] animate-drift3" />
        <div className="absolute inset-0 bg-background/50" />
      </div>

      {curSession ? (
        <div className="relative z-10 flex flex-col h-full">
          <ChatHeader setShowProfile={setShowProfile} />
          <ChatMessageList />
          <ChatInput />
          {showProfile && curSession && (
            <UserProfilePanel
              curSession={curSession}
              onClose={() => setShowProfile(false)}
            />
          )}
        </div>
      ) : (
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-2 text-center">
          <p className="text-muted-foreground text-lg font-medium">
            Select a chat to start messaging
          </p>
          <p className="text-muted-foreground/60 text-sm">
            Your conversations are end-to-end encrypted
          </p>
        </div>
      )}
    </div>
  );
}
