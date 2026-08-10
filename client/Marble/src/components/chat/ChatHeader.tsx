// import { Circle } from "lucide-react";
import { sessionsState } from "@sessions/stateSession";
import { stateCommon } from "@states/stateCommon";
import { StateVariables } from "@internal/intrCmnVars";

export default function ChatHeader() {
  const { currentSessionId, sessions } = sessionsState();
  const curSession = sessions.get(currentSessionId);
  const { setState } = stateCommon();

  return (
    <button
      onClick={() => setState(StateVariables.SHOW_PROFILE_PANEL, true)}
      className="w-full flex items-center gap-3 px-5 py-3 border-5 border-black/0 bg-black/0  hover:bg-gray-700/10 transition-colors z-20 text-left shrink-0"
    >
      <div className="relative">
        <div className="w-10 h-10 bg-linear-to-br from-primary to-accent rounded-full flex items-center justify-center text-lg font-bold text-primary-foreground shadow-sm">
          {curSession?.audience.name?.charAt(0).toUpperCase()}
        </div>
        {/* {curSession?.audience.isOnline && (
          <Circle className="absolute bottom-0 right-0 w-3 h-3 bg-accent text-accent rounded-full border-2 border-background" />
        )} */}
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="text-foreground text-lg  truncate">
          {curSession?.audience.name}
        </h2>
        <p className="text-xs text-muted-foreground truncate">
          {/* {curSession?.audience.isOnline ? "Online" : "Offline"} */}
        </p>
      </div>
    </button>
  );
}
