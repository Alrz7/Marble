package active

import (
	"encoding/json"
	"log"
	"net/http"
	"github.com/gorilla/websocket"
)

// Request matching the client's type
type Request struct {
	Channel string `json:"channel"`
	Body    string `json:"body"`
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true }, // Allow all origins for development
}

func HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Upgrade failed:", err)
		return
	}
	defer conn.Close()

	log.Println("Client connected")

	// Send initial message on "sessions" channel as a welcome
	welcome := Request{
		Channel: "sessions",
		Body:    "connected",
	}
	if err := conn.WriteJSON(welcome); err != nil {
		log.Println("Write error:", err)
		return
	}

	// Read loop: receive and ignore messages (but validate JSON)
	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			log.Println("Read error or client disconnected:", err)
			break
		}

		var req Request
		if err := json.Unmarshal(message, &req); err != nil {
			log.Println("Invalid JSON from client:", err)
			continue
		}

		log.Printf("Received channel=%s body=%s\n", req.Channel, req.Body)
	}
}
