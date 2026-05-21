package active

import (
	"encoding/json"
	"errors"
	"fmt"
	"marble/internal/loggy"
	"net/http"

	"github.com/golang-jwt/jwt/v5"
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

	DefaultLogger.Info("Client connected")
	conn.SetReadLimit(4096)

	err = authorizeConnection(conn, jwtSecretKey)
	if err != nil {
		conn.WriteMessage(websocket.TextMessage, fmt.Appendf([]byte{}, `{"error": %v}`, err))
		return
	}
	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			// DefaultLogger.Warn("Read error or client disconnected:", err)
			break
		}

		user, err := GetUserOf(conn)
		if user == nil {
			if err != nil {
				conn.WriteMessage(websocket.TextMessage, fmt.Appendf([]byte{}, `{"error": %v}`, err))
			} else {
				conn.WriteMessage(websocket.TextMessage, []byte(`{"error": "there was an error while finding the active-User"}`))
			}
			break
		}

		var req Request
		req.conn = conn
		req.user = user
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
		"session":    HndlSessions,
		"searchUser": HndlSearchUser,
	}
	Handeler, ok := Handelers[Request.Channel]
	if !ok {
		//any errors or anything else
		return
	}
	Handeler(Request)
}

func authorizeConnection(conn *websocket.Conn, jwtSecretKey []byte) error {
	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			return err
		}
		var req struct {
			Token string `json:"token"`
		}
		if err := json.Unmarshal(msg, &req); err != nil || req.Token == "" {
			return errors.New("authentication required")
		}
		claims := &Claims{}
		token, err := jwt.ParseWithClaims(req.Token, claims, func(t *jwt.Token) (any, error) {
			return jwtSecretKey, nil
		})
		if err != nil || !token.Valid {
			return errors.New("Invalid token")
		}

		newActiveUser, err := GetActiveUser(claims.UserId)
		if err != nil {
			return err
		}
		newActiveUser.InsertAs(conn)
		conn.WriteMessage(websocket.TextMessage, []byte(`{"type":"auth","status":"ok"}`))
		continue
	}
}
