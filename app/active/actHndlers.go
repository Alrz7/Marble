package active

import (
	"encoding/json"
	"fmt"

	"github.com/gorilla/websocket"
)

// 					--------- Note -----------
// all of this Handelers should cooperate under the Active authentication system
// to access to the ActiveUser & User methods and Parameters
// im not adding that parts Now but i'll develop other blocks for now and
// wrap them up later.

func HndlSessions(req *Request) {
	entry := struct {
		SessionId uint64 `json:"session_id"`
		Message   string `json:"message"`
	}{}
	err := json.Unmarshal([]byte(req.Body), &entry)
	if err != nil {
		DefaultLogger.Error(err)
	}
	DefaultLogger.Info(fmt.Sprintf(`new Message from <%v> : %v`, req.user.UserName, entry.Message))
}

func HndlSearchUser(req *Request) {
	//<---NOTE--->
	// search in active storage for quick search first and if we didn't  find the user we search over the main DB
	entry := struct {
		Param string `json:"param"`
	}{}
	err := json.Unmarshal([]byte(req.Body), &entry)
	if err != nil {
		DefaultLogger.Error(err)
	}
	DefaultLogger.Info(entry.Param)
}

func sendRequest(conn *websocket.Conn, req *Request) {
	b, err := json.Marshal(req)
	if err != nil {

	}
	conn.WriteMessage(websocket.TextMessage, b)
}
