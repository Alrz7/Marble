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

func HndlCreateSession(req *Request) error {
	entry := struct {
		AudienceId     int                `json:"audienceId"`
		Message        string             `json:"message"`
		MessageEventId int                `json:"messageEventId"`
		SessionEventId internal.SessionId `json:"sessionEventId"`
	}{}
	err := json.Unmarshal([]byte(req.Body), &entry)
	if err != nil {
		actBadRequestResponse(req.conn, err)
		return err
	}

	Beta, err := db.AppModels.UserModel.GetUserProfile(internal.UserId(entry.AudienceId))
	if err != nil {
		actNotFoundResponse(req.conn, err)
		return err
	}
	newSeq, err := db.AppModels.UserModel.IncreaseSessionLastSeq(req.user.Id)
	if err != nil {
		return err
	}
	_, err = db.AppModels.UserModel.IncreaseSessionLastSeq(Beta.Id)
	if err != nil {
		return err
	}

	newSession, err := db.AppModels.SessionModel.CreateSession(req.user.Id, Beta.Id, newSeq)
	if err != nil {
		loggy.DefaultLogger.Error(err)
		return err
	}
	err = req.user.onDeliverSession(newSession, Beta, entry.Message)
	if err != nil {
		DefaultLogger.Info(err)
		return err
	}

	// we can add a notif for reading the sgined messages on beta's Reading message side...
	messageEventResponse := createNewMessageResponse(entry.SessionEventId, entry.MessageEventId, "sent")
	req.onSendSessionEventResponce(entry.SessionEventId, newSession, Beta, true, messageEventResponse)
	return nil
}

func (u *ActvUser) onDeliverSession(session *session.Session, audience *users.User, content string) error {
	userOnlineConn, isOnline := GetConnByUserId(audience.Id)

	newMessage, err := u.onGenerateNewMessage(session, content)
	if err != nil {
		DefaultLogger.Info(err)
		return err
	}
	if isOnline {
		u.OnAddSession(userOnlineConn, session, u.User, newMessage)
	} else {
		err = db.AppModels.MessageModel.Insert(newMessage)
	}
	return err
}

func (u *ActvUser) OnAddSession(conn *websocket.Conn, session *session.Session, audience *users.User, message *session.Message) {
	sendingSession := envelope{"sessionId": session.Id, "seq": session.Seq, "audience": internal.Audience{Name: audience.UserName,
		UserId:        audience.Id,
		DisplayId:     audience.DisplayId,
		ProfileAvatar: audience.ProfileAvatar,
		ArmedPubKey:   audience.PgpProfile.PublicKey}}

	Body := envelope{"sessions": []*envelope{&sendingSession}}
	if message != nil {
		Body["message"] = message
	}
	headers := RequestHeaders{"task": "add"}
	sendHandlerResponse(conn, StatusPending, "sessions", headers, Body)
}

func HndlDeleteSession(req *Request) error {
	entry := struct {
		SessionId uint64 `json:"sessionId"`
	}{}
	err := json.Unmarshal([]byte(req.Body), &entry)
	if err != nil {
		actBadRequestResponse(req.conn, err)
		return err
	}
	session, err := req.user.GetSessionById(internal.SessionId(entry.SessionId))
	if err != nil {
		actNotFoundResponse(req.conn, err)
		return err
	}
	if req.user.Id == session.Alpha || req.user.Id == session.Beta {
		err = db.AppModels.SessionModel.Delete(session.Id)
		if err != nil {
			return err
		}
	} else {
		return loggy.Say("this Client doesn't have permision for this operation")
	}
	return nil
}
