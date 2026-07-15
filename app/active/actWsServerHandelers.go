package active

import (
	"encoding/json"
	"errors"
	"marble/internal"
	"marble/internal/loggy"

	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/websocket"
)

func HndlAuthorizeConnection(conn *websocket.Conn, jwtSecretKey []byte) error {
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
		conn:    conn,
		Channel: "auth",
		Status:  StatusApproved,
		Notif: &Notification{
			Type:    "success",
			Key:     "userAuthorized",
			Message: "authorization successfull!",
		},
	}
	err = resp.sendRequest()
	if err != nil {
		return err
	}
	return nil

}

func (req *Request) sendRequest() error {
	if req.conn == nil {
		return loggy.Say("there was no Ws-conn inside the request")
	}
	b, err := json.Marshal(req)
	if err != nil {
		actServerErrorResponse(req.conn, err)
		return err
	}
	err = req.conn.WriteMessage(websocket.TextMessage, b)
	if err != nil {
		return err
	}
	return nil
}
