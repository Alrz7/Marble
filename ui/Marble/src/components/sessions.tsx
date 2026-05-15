import { User } from "../logic/internal/commonTypes";
import "./styles/sessions.css";
import { getInitials } from "../logic/internal/helperfuncs";

interface entry {
  user: User;
  setCurrnetSession: (
    beta: string,
    sessionIds: { sessionId: number; storageId: string },
  ) => void;
  // setUserData: React.Dispatch<React.SetStateAction<User | null>>;
}

export default function Sessions({ user, setCurrnetSession }: entry) {
  return (
    <div className="sessions-container">
      {user?.config?.sessions
        ? Object.entries(user.config.sessions).map(([addr, sessionKey]) => (
            <Session
              key={sessionKey.sessionId}
              addr={addr}
              sessionKey={sessionKey}
              setCurrnetSession={setCurrnetSession}
            />
          ))
        : null}
    </div>
  );
}

function Session({
  addr,
  sessionKey,
  setCurrnetSession,
}: {
  addr: string;
  sessionKey: { sessionId: number; storageId: string };
  setCurrnetSession: (
    beta: string,
    sessionIds: { sessionId: number; storageId: string },
  ) => void;
}) {
  return (
    <div className="session">
      <div
        className="session-profile"
        onClick={() => {
          setCurrnetSession(addr, sessionKey);
        }}
      >
        <button className="session-avatar">{getInitials(addr)}</button>
        <div className="session-info">
          <h3>{addr}</h3>
          <p>recently</p>
        </div>
      </div>
    </div>
  );
}
