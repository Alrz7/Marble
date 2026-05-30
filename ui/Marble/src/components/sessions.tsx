import "./styles/sessions.css";
import { getInitials } from "../logic/internal/helperfuncs";
import { SessionsProps, tpSetCurrnetSession } from "../logic/internal/tsxTypes";
import { sessionAudience } from "../logic/internal/commonTypes";



export default function Sessions({ user, setCurrnetSession }: SessionsProps) {
  return (
    <div className="sessions-container">
      {user?.config?.sessions
        ? Object.entries(user.config.sessions).map(([userName, audience]) => (
            <Session
              key={audience.sessionId}
              userName={userName}
              audience={audience}
              setCurrnetSession={setCurrnetSession}
            />
          ))
        : null}
    </div>
  );
}

function Session({
  userName,
  audience,
  setCurrnetSession,
}: {
  userName: string;
  audience: sessionAudience
  setCurrnetSession: tpSetCurrnetSession
}) {
  return (
    <div className="session">
      <div
        className="session-profile"
        onClick={() => {
          setCurrnetSession(audience);
        }}
      >
        <button className="session-avatar">{getInitials(userName)}</button>
        <div className="session-info">
          <h3>{userName}</h3>
          <p>recently</p>
        </div>
      </div>
    </div>
  );
}
