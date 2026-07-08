import { useEffect, useState } from "react";
import { Circle } from "lucide-react";
import { sessionsState } from "../../logic/states/sessionStates";
import { AppUser } from "../../logic/states/userMainStates";
import { GetSessions } from "../../logic/db/dbSessions";

export default function SessionsList() {
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(
    null,
  );
  const { currentUser } = AppUser();
  const { sessionlist, setSessionList, setCurrentSession } = sessionsState();

  useEffect(() => {
    async function getSessions() {
      if (currentUser?.config) {
        const sessions = await GetSessions(
          currentUser.config.id,
          currentUser.MasterKey,
        );
        setSessionList(sessions);
      }
    }
    getSessions();
  }, []);

  return (
    <div className="space-y-1 p-2">
      {sessionlist.map((session) => (
        <button
          key={session.sessionId}
          onClick={() => {
            setCurrentSession(session);
            setSelectedSessionId(session.sessionId);
          }}
          className={`w-full px-3 py-3 rounded-lg transition-colors flex items-start gap-3 ${
            selectedSessionId === session.sessionId
              ? "bg-primary/20 border border-primary/50"
              : "hover:bg-secondary"
          }`}
        >
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-sm font-bold text-primary-foreground">
              {session.audience.name.charAt(0)}
            </div>
            {session.audience.isOnline && (
              <Circle className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 text-green-500 rounded-full border-2 border-background" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 text-left">
            <div className="flex justify-between items-baseline gap-2">
              <h3 className="font-medium text-foreground text-sm truncate">
                {session.audience.name}
              </h3>
              <span className="text-xs text-muted-foreground flex-shrink-0">
                {/* {session.timestamp} */}timestamp
              </span>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {/* {session.lastMessage} */}lastMessage
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
