import { Bookmark, MessageCircle } from "lucide-react";
import { searchResult } from "@states/stateCommon";
import { Audience, Session } from "@internal/intrCmnTypes";
import { sessionsState } from "@sessions/stateSession";
import { AppUser } from "@states/stateUser";
import { IsAlreadyInTouch } from "@sessions/sessionHelpers";
import { reserveSessionId } from "@sessions/sessionHelpers";
import { SavedMessagesSesionId } from "@internal/intrCmnVars";

interface SearchPanelProps {
  query: string;
}

export default function SearchPanel({ query }: SearchPanelProps) {
  const { Users } = searchResult();
  const { addSession, setCurrentSessionId } = sessionsState();
  const { currentUser } = AppUser();

  async function setNewSessionOnStage(audience: Audience) {
    if (!currentUser) return;
    const existing = await IsAlreadyInTouch(audience);
    if (existing !== null) {
      setCurrentSessionId(existing.id);
    } else {
      const newReservedId = reserveSessionId();
      audience.ownerId = currentUser.config.id;
      const preReservedSession: Session = {
        id: newReservedId,
        seq: newReservedId,
        ownerId: currentUser?.config.id,
        sessionId: newReservedId,
        onCreateStage: true,
        audience: audience,
        message_sequence: 0,
      };
      if (audience.isSavedMessages) {
        preReservedSession.sessionId = SavedMessagesSesionId;
        preReservedSession.isSavedMessages = true;
      }

      addSession(preReservedSession);
      setCurrentSessionId(newReservedId);
    }
  }

  if (Users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 text-center gap-1">
        <MessageCircle className="w-10 h-10 text-muted-foreground/30 mb-3" />
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
          className="w-full px-3 py-3 rounded-xl hover:bg-white/5 transition-colors flex items-center gap-3"
          onClick={() => setNewSessionOnStage(user)}
        >
          <div className="w-10 h-10 bg-linear-to-br from-primary to-accent rounded-full flex items-center justify-center text-sm font-bold text-primary-foreground shrink-0">
            {user.isSavedMessages ? <Bookmark /> : user.name.charAt(0)}
          </div>
          <div className="text-left">
            <h3 className="font-medium text-foreground text-sm">{user.name}</h3>
            <p className="text-xs text-muted-foreground">Start new chat</p>
          </div>
        </button>
      ))}
    </div>
  );
}
