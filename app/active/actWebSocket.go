package active

import (
	"encoding/json"
	"marble/internal/loggy"
	"net/http"

	"github.com/gorilla/websocket"
)

var DefaultLogger = loggy.DefaultLogger
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true }, // Allow all origins for development
}

func HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		DefaultLogger.Error("Upgrade failed:", err)
		return
	}
	defer conn.Close()
	DefaultLogger.Info("Client connected")

	// welcome := Request{
	// 	Channel: "sessions",
	// 	Body:    "connected",
	// }
	// if err := conn.WriteJSON(welcome); err != nil {
	// 	log.Println("Write error:", err)
	// 	return
	// }

	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			// DefaultLogger.Warn("Read error or client disconnected:", err)
			break
		}

		var req Request
		req.conn = conn
		if err := json.Unmarshal(message, &req); err != nil {
			DefaultLogger.Info(req)
			DefaultLogger.Error("Invalid JSON from client:", err)
			continue
		}
		manageHandeler(&req)
		// DefaultLogger.Info("Received channel=%s body=%s\n", req.Channel, req.Body)
	}
}

func manageHandeler(Request *Request) {
	Handelers := map[RequestChannel]Handeler{
		"session": HndlSessions,
	}
	Handeler, ok := Handelers[Request.Channel]
	if !ok {
		//any errors or anything else
		return
	}
	Handeler(Request)
}
