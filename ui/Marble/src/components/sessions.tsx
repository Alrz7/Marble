import { JSX } from "react";
import { User } from "../logic/internal/commonTtypes";
import "./styles/sessions.css";
import { getInitials } from "../logic/internal/helperfuncs";

interface entry {
  user: User;
  // setUserData: React.Dispatch<React.SetStateAction<User | null>>;
}

export default function Sessions({ user }: entry) {
  return (
    <>
      <div className="sessions-container">
        {user?.config?.sessions
          ? Object.entries(user.config.sessions).map(([addr, sessionKey]) =>
              Session(addr, sessionKey),
            )
          : ""}
        {/* <Session /> */}
      </div>
    </>
  );
}

function Session(addr: string, sessionKey: number) {
  return (
    <>
      <div className="session">
        <div className="session-profile">
          <button className="session-avatar">
            {false ? (
              <img
                src={addr}
                alt={addr}
                style={{ width: "100%", height: "100%", borderRadius: "50%" }}
              />
            ) : (
              getInitials(addr)
            )}
          </button>
          <div className="session-info">
            <h3>{addr}</h3>
            <p>{"recently"}</p>
          </div>
        </div>
      </div>
    </>
  );
}
