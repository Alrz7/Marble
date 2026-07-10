import { MessageCircle } from "lucide-react";
import { searchResult } from "../../logic/states/appCommonStates";
import { Audience, Session } from "../../logic/internal/commonTypes";
import {
  reserveSessionId,
  sessionsState,
} from "../../logic/states/sessionStates";
import { AppUser } from "../../logic/states/userMainStates";
import { SameOnStage } from "../../logic/active/actSessionHandlers";

interface SearchPanelProps {
  query: string;
}

export default function SearchPanel({ query }: SearchPanelProps) {
  const { Users } = searchResult();
  const { addSession, setCurrentSessionId } = sessionsState();
  const { currentUser } = AppUser();

  /**
creates a preReserved Session with CreateStage=on to use HandleCreate while sending the Starting
message to initiate the new session
 */
  async function setNewSessionOnStage(audience: Audience) {
    if (!currentUser) return;
    const newReservedId = reserveSessionId();
    audience.ownerId = currentUser.config.id;
    const preReservedSession: Session = {
      id: newReservedId,
      ownerId: currentUser?.config.id,
      sessionId: newReservedId,
      onCreateStage: true,
      audience: audience,
    };
    const existing = await SameOnStage(preReservedSession);
    if (existing == null) {
      addSession(preReservedSession);
      setCurrentSessionId(newReservedId);
    } else {
      setCurrentSessionId(existing.id);
    }
  }

  if (Users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 text-center">
        <MessageCircle className="w-12 h-12 text-muted-foreground/30 mb-4" />
        <p className="text-muted-foreground text-sm">
          No users found matching &quot;{query}&quot;
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1 p-2">
      <p className="text-xs text-muted-foreground px-3 py-2">
        Found {Users.length} {Users.length === 1 ? "user" : "users"}
      </p>

      {Users.map((user) => (
        <button
          key={user.userId}
          className="w-full px-3 py-3 rounded-lg hover:bg-secondary transition-colors flex items-center gap-3"
          onClick={() => {
            setNewSessionOnStage(user);
          }}
        >
          {/* Avatar */}
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-sm font-bold text-primary-foreground flex-shrink-0">
            {user.name.charAt(0)}
          </div>

          {/* Info */}
          <div className="text-left">
            <h3 className="font-medium text-foreground text-sm">{user.name}</h3>
            <p className="text-xs text-muted-foreground">Start new chat</p>
          </div>
        </button>
      ))}
    </div>
  );
}
