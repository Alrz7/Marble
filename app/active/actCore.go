package active

import (
	"encoding/json"
	"marble/internal"
	"marble/internal/loggy"
	"net/http"

	"github.com/gorilla/websocket"
)

var DefaultLogger = loggy.DefaultZapLogger
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true }, // Allow all origins for development
}

func WebSocket(w http.ResponseWriter, r *http.Request, jwtSecretKey []byte) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		loggy.Get(err).SetMessage("Upgrade failed").Panic()
		return
	}

	defer func() {
		err = conn.Close()
		if err != nil {
			loggy.NewAppErr(err.Error()).Panic()
		}
		DeleteUserOf(conn)
	}()

	conn.SetReadLimit(4096)

	err = HndlAuthorizeConnection(conn, jwtSecretKey)
	if err != nil {
		loggy.Get(err).SetMessage("failed to authodize connection").Log()
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
			loggy.Get(err).SetMessage("Invalid JSON from client").Log()
			continue
		}
		manageHandeler(&req)
	}
}

func manageHandeler(Request *Request) {
	Handelers := map[RequestChannel]Handeler{
		"sessions":   HndlSessions,
		"messages":   HndlMessages,
		"searchUser": HndlSearchUser,
	}
	// fmt.Println(Request.Channel, Request.Headers)
	Handeler, ok := Handelers[Request.Channel]
	if !ok {
		//any errors or anything else
		return
	}
	Handeler(Request)
}
