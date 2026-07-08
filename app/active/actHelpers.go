package active

import (
	"encoding/json"

	"github.com/gorilla/websocket"
)

func sendHandlerResponse(conn *websocket.Conn, status RequestStatus, channel string, headers RequestHeaders, body any) {
	bodyInBytes, err := json.Marshal(body)
	if err != nil {
		DefaultLogger.Error(err)
	}
	resp := Request{
		conn:    conn,
		Status:  status,
		Channel: channel,
		Headers: headers,
		Body:    string(bodyInBytes),
	}
	err = resp.sendRequest()
	if err != nil {
		actServerErrorResponse(conn, err)
	}
}
