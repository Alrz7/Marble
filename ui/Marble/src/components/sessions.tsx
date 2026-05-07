import "./styles/sessions.css";

export default function Sessions() {
  return (
    <>
      <div className="sessions-container">
        <Session />
        <Session />
        <Session />
        <Session />
        <Session />
        <Session />
        <Session />
        <Session />
        <Session />
        <Session />
        <Session />
        <Session />
      </div>
    </>
  );
}

function Session() {
  return (
    <>
      <div className="session">
        <div className="session-profile">
          <button className="session-avatar">
            {false ? (
              <img
                src={"j"}
                alt={"j"}
                style={{ width: "100%", height: "100%", borderRadius: "50%" }}
              />
            ) : (
              //   getInitials("john")
              "J"
            )}
          </button>
          <div className="session-info">
            <h3>{"john"}</h3>
            <p>{"online"}</p>
          </div>
        </div>
      </div>
    </>
  );
}
