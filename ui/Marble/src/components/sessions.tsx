import { User } from "../logic/internal/commonTtypes";
import "./styles/sessions.css";
import { getInitials } from "../logic/internal/helperfuncs";

interface entry {
  user: User;
  // setUserData: React.Dispatch<React.SetStateAction<User | null>>;
}

export default function Sessions({ user }: entry) {
  return (
    <div className="sessions-container">
      {user?.config?.sessions
        ? Object.entries(user.config.sessions).map(([addr, sessionKey]) => (
            <Session
              key={sessionKey.sessionId}
              addr={addr}
              sessionKey={sessionKey}
            />
          ))
        : null}
    </div>
  );
}

function Session({
  addr,
  sessionKey,
}: {
  addr: string;
  sessionKey: { sessionId: number; storageId: string };
}) {
  return (
    <div className="session">
      <div className="session-profile">
        <button className="session-avatar">{getInitials(addr)}</button>
        <div className="session-info">
          <h3>{addr}</h3>
          <p>recently</p>
        </div>
      </div>
    </div>
  );
}
