package active

import (
	"encoding/json"
	"fmt"
	"marble/internal"

	"github.com/gorilla/websocket"
)

func logError(err error) {
	DefaultLogger.Error(err)
}

func actErrorResponse(conn *websocket.Conn, errorType string, message string) {
	notif := &Notif{
		Type:    errorType,
		Message: message,
	}
	b, err := json.Marshal(notif)
	if err != nil {
		actServerErrorResponse(conn, err)
	}
	resp := Request{
		conn:    conn,
		Status:  StatusError,
		Channel: "notif",
		Body:    string(b),
	}
	resp.sendRequest()
}

func actServerErrorResponse(conn *websocket.Conn, err error) {
	logError(err)
	message := fmt.Sprintf("the server encountered a problem: %v", err)
	actErrorResponse(conn, internal.ActStatusInternalServerError, message)
}

func actNotFoundResponse(conn *websocket.Conn, err error) {
	message := fmt.Sprintf("the requested resource could not be found: %v", err)
	actErrorResponse(conn, internal.ActStatusNotFound, message)
}

func actMethodNotAllowedResponse(conn *websocket.Conn, err error) {
	message := fmt.Sprintf("the method is not supported for this resource: %v", err)
	actErrorResponse(conn, internal.ActStatusMethodNotAllowed, message)
}

func actBadRequestResponse(conn *websocket.Conn, err error) {
	message := fmt.Sprintf("err: %v", err)
	actErrorResponse(conn, internal.ActStatusBadRequest, message)
}
