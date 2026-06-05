package active

import (
	"encoding/json"
	"marble/internal"
	"marble/internal/loggy"
	"net/http"

	"github.com/gorilla/websocket"
)

var DefaultLogger = loggy.DefaultLogger
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true }, // Allow all origins for development
}

func WebSocket(w http.ResponseWriter, r *http.Request, jwtSecretKey []byte) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		DefaultLogger.Error("Upgrade failed:", err)
		return
	}

	defer func() {
		conn.Close()
		DeleteUserOf(conn)
	}()

	conn.SetReadLimit(4096)

	err = HndlauthorizeConnection(conn, jwtSecretKey)
	if err != nil {
		return
	}
	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			break
		}

		user, err := GetUserOf(conn)
		if user == nil {
			if err != nil {
				actServerErrorResponse(conn, err) // should we send the server errors to the client to ?? :|
			} else {
				actErrorResponse(conn, internal.ActUserNotFound, "user was not found!")
			}
			break
		}

		var req Request
		req.conn = conn
		req.user = user
		if err := json.Unmarshal(message, &req); err != nil {
			DefaultLogger.Error("Invalid JSON from client:", err)
			continue
		}
		manageHandeler(&req)
	}
}

func manageHandeler(Request *Request) {
	Handelers := map[RequestChannel]Handeler{
		"sessions": HndlSessions,
		"searchUser":     HndlSearchUser,
	}
	Handeler, ok := Handelers[Request.Channel]
	if !ok {
		//any errors or anything else
		return
	}
	Handeler(Request)
}
