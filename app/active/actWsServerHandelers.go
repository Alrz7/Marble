package active

import (
	"encoding/json"
	"errors"
	"marble/internal"
	"marble/internal/loggy"

	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/websocket"
)

func HndlauthorizeConnection(conn *websocket.Conn, jwtSecretKey []byte) error {
	_, msg, err := conn.ReadMessage()
	if err != nil {
		actBadRequestResponse(conn, err)
		return err
	}
	var req Request
	if err := json.Unmarshal(msg, &req); err != nil || req.Token == "" {
		actErrorResponse(conn, internal.ActAuthenticationError, "authentication failed")
		return loggy.Sayr("authentication failed", err)
	}
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(req.Token, claims, func(t *jwt.Token) (any, error) {
		return jwtSecretKey, nil
	})
	if err != nil || !token.Valid {
		actErrorResponse(conn, internal.ActInvalidTokenError, "Invalid token")
		return errors.New("Invalid token")
	}

	newActiveUser, err := GetActiveUser(claims.UserId)
	if err != nil {
		actErrorResponse(conn, internal.ActUserNotFound, err.Error())
		return err
	}
	newActiveUser.InsertAs(conn)
	resp := Request{
		Channel: "auth",
		Status:  StatusApproved,
		Message: "authorization successfull!",
	}
	err = resp.sendRequest()
	if err != nil {
		return err
	}
	return nil

}

func (req *Request) sendRequest() error {
	b, err := json.Marshal(req)
	if err != nil {
		actServerErrorResponse(req.conn, err)
		return err
	}
	req.conn.WriteMessage(websocket.TextMessage, b)
	return nil
}
