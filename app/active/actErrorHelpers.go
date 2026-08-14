package active

import (
	"fmt"
	"marble/internal"
	"marble/internal/loggy"

	"github.com/gorilla/websocket"
)

func actErrorResponse(conn *websocket.Conn, errorType string, message string) {
	notif := &Notification{
		Type:    "error",
		Key:     errorType,
		Message: message,
	}
	resp := Request{
		conn:    conn,
		Status:  StatusError,
		Channel: "notif",
		Notif:   notif,
		Headers: RequestHeaders{},
	}
	err := resp.sendRequest()
	if err != nil {
		loggy.Get(err).Log()
		// actServerErrorResponse(conn, err)
	}
}

func actServerErrorResponse(conn *websocket.Conn, err error) {
	loggy.Get(err).Log()
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
