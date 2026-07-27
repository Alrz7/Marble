package active

import (
	"encoding/json"
	"marble/app/session"
	"marble/app/users"
	"marble/db"
	"marble/internal"
	"marble/internal/loggy"

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

func createNewMessageResponse(sessionId internal.SessionId, messageEventId int, status string) envelope {
	return envelope{"sessionId": sessionId, "messageEventId": messageEventId, "status": status}
}

func (req *Request) onSendMessageEventResponce(sessionId internal.SessionId, messageEventId int, status string) {
	resp := createNewMessageResponse(sessionId, messageEventId, status)
	headers := RequestHeaders{"task": "event"}
	sendHandlerResponse(req.conn, StatusApproved, "messages", headers, resp)
}

func (req *Request) onSendSessionEventResponce(sessionEventId internal.SessionId, registeredSession *session.Session, audience *users.User, verified bool, messageEventResponse envelope) {
	sendingSession := envelope{"sessionId": registeredSession.Id, "seq": registeredSession.Seq, "audience": internal.Audience{Name: audience.UserName,
		UserId:        audience.Id,
		DisplayId:     audience.DisplayId,
		ProfileAvatar: audience.ProfileAvatar,
		ArmedPubKey:   audience.PgpProfile.PublicKey}}

	resp := envelope{"sessionEventId": sessionEventId, "registeredSession": sendingSession, "verified": verified, "messageEventResponse": messageEventResponse}
	headers := RequestHeaders{"task": "event"}
	sendHandlerResponse(req.conn, StatusApproved, "sessions", headers, resp)
}

func (AU *ActvUser) GetSessionById(sessionId internal.SessionId) (*session.Session, error) {
	session, err := db.AppModels.SessionModel.Get(sessionId)
	if err != nil {
		return nil, loggy.Sayr("error while fetching session", err)
	}
	return session, nil
}
