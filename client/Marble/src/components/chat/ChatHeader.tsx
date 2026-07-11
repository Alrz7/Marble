import { Circle } from "lucide-react";
import { sessionsState } from "../../logic/states/sessionStates";

export default function ChatHeader({
  setShowProfile,
}: {
  setShowProfile: (b: boolean) => void;
}) {
  const { currentSessionId, sessions } = sessionsState();
  const curSession = sessions.get(currentSessionId);

  return (
    <div className="relative z-10 flex items-center justify-between px-6 py-4 glass-panel">
      <button
        onClick={() => setShowProfile(true)}
        className="flex items-center gap-3 rounded-xl px-2 py-1.5 -ml-2 hover:bg-white/5 transition-colors"
      >
        <div className="relative">
          <div className="w-11 h-11 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-sm font-bold text-primary-foreground">
            {curSession?.audience.name?.charAt(0)}
          </div>
          {curSession?.audience.isOnline && (
            <Circle className="absolute bottom-0 right-0 w-3 h-3 bg-accent text-accent rounded-full border-2 border-background" />
          )}
        </div>
        <div className="text-left">
          <h2 className="font-semibold text-foreground">
            {curSession?.audience.name}
          </h2>
          <p className="text-xs text-muted-foreground">
            {curSession?.audience.isOnline ? "Online" : "Offline"}
          </p>
        </div>
      </button>
    </div>
  );
}
