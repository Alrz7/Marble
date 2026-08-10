import ChatHeader from "./ChatHeader";
import ChatMessageList from "./ChatMessageList";
import ChatInput from "./ChatInput";
import { sessionsState } from "@sessions/stateSession";
import UserProfilePanel from "./UserProfilePanel";
import { stateCommon } from "@states/stateCommon";
import { StateVariables } from "@internal/intrCmnVars";

export default function ChatArea() {
  const { states, setState } = stateCommon();
  const { currentSessionId, sessions } = sessionsState();
  const curSession = sessions.get(currentSessionId);
  return (
    <div className="relative flex flex-col h-full bg-background overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-20 w-96 h-96 rounded-full bg-glow-indigo/25 blur-[110px] animate-drift1" />
        <div className="absolute top-20 -right-24 w-96 h-96 rounded-full bg-[#96969E]/14 blur-[110px] animate-drift2" />
        <div className="absolute -bottom-24 left-1/3 w-80 h-80 rounded-full bg-[#9E8459]/14 blur-[110px] animate-drift3" />
        <div className="absolute inset-0 bg-background/50" />
      </div>

      {curSession ? (
        <div className="relative z-10 flex flex-col h-full">
          <ChatHeader />
          <ChatMessageList />
          <ChatInput />
          {states.get(StateVariables.SHOW_PROFILE_PANEL) && curSession && (
            <UserProfilePanel
              curSession={curSession}
              onClose={() => setState(StateVariables.SHOW_PROFILE_PANEL, false)}
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
