import { Circle } from "lucide-react";
import { sessionsState } from "@sessions/sessionStates";

export default function ChatHeader({
  setShowProfile,
}: {
  setShowProfile: (b: boolean) => void;
}) {
  const { currentSessionId, sessions } = sessionsState();
  const curSession = sessions.get(currentSessionId);

  return (
    <button
      onClick={() => setShowProfile(true)}
      className="absolute top-2 left-1/2 -translate-x-1/2 z-20 w-5/6 flex items-center gap-3 rounded-xl px-4 py-2.5 border border-gray-700 bg-[#42424212] hover:bg-[#5a5a5a21] transition-colors"
    >
      <div className="relative">
        <div className="w-10 h-10 bg-linear-to-br from-primary to-accent rounded-full flex items-center justify-center text-sm font-bold text-primary-foreground">
          {curSession?.audience.name?.charAt(0)}
        </div>
        {curSession?.audience.isOnline && (
          <Circle className="absolute bottom-0 right-0 w-3 h-3 bg-accent text-accent rounded-full border-2 border-background" />
        )}
      </div>
      <div className="text-left">
        <h2 className="font-semibold text-foreground text-sm">
          {curSession?.audience.name}
        </h2>
        <p className="text-xs text-muted-foreground">
          {curSession?.audience.isOnline ? "Online" : "Offline"}
        </p>
      </div>
    </button>
  );
}
