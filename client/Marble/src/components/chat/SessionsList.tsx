import { useEffect } from "react";
import { Circle } from "lucide-react";
import { sessionsState } from "../../logic/states/sessionStates";
import { AppUser } from "../../logic/states/userMainStates";
import { GetSessions } from "../../logic/db/dbSessions";

export default function SessionsList() {
  const { currentUser } = AppUser();
  const { sessions, setSessions, currentSessionId, setCurrentSessionId } = sessionsState();

  useEffect(() => {
    async function getSessions() {
      if (currentUser) {
        const sessions = await GetSessions(currentUser.config.id, currentUser.MasterKey);
        setSessions(sessions);
      }
    }
    getSessions();
  }, [currentUser]);

  return (
    <div className="space-y-1 p-2">
      {[...sessions.values()].map((session) => {
        const isActive = currentSessionId === session.id;
        return (
          <button
            key={session.sessionId}
            onClick={() => setCurrentSessionId(session.id)}
            className={`w-full px-3 py-3 rounded-xl transition-colors flex items-start gap-3 ${
              isActive ? "bg-primary/15" : "hover:bg-white/5"
            }`}
            style={isActive ? { boxShadow: "inset 3px 0 0 0 #7B86C9" } : undefined}
          >
            <div className="relative shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-sm font-bold text-primary-foreground">
                {session.audience.name.charAt(0)}
              </div>
              {session.audience.isOnline && (
                <Circle className="absolute bottom-0 right-0 w-3 h-3 bg-accent text-accent rounded-full border-2 border-background" />
              )}
            </div>

            <div className="flex-1 min-w-0 text-left">
              <div className="flex justify-between items-baseline gap-2">
                <h3 className="font-medium text-foreground text-sm truncate">{session.audience.name}</h3>
                <span className="text-xs text-muted-foreground shrink-0">timestamp</span>
              </div>
              <p className="text-xs text-muted-foreground truncate">lastMessage</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
