package active

import (
	"encoding/json"
	"errors"
	"marble/app/session"
	"marble/app/users"
	"marble/db"
	"marble/internal"
	"marble/internal/loggy"

	"github.com/gorilla/websocket"
)

// --------- session ---------
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
	req.onSendSessionEventResponce(entry.SessionEventId, newSession, Beta, true)
	req.onSendMessageEventResponce(entry.SessionEventId, entry.MessageEventId, "sent")
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

// --- Messages ---
func HndlSendMessage(req *Request) error {
	entry := struct {
		AudienceId     internal.UserId `json:"audienceId"`
		SessionId      uint64          `json:"sessionId"`
		Message        string          `json:"message"`
		MessageEventId int             `json:"messageEventId"`
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
	err = req.user.SendMessage(session, entry.Message)
	if err != nil {
		actServerErrorResponse(req.conn, err)
		return err
	}
	req.onSendMessageEventResponce(session.Id, entry.MessageEventId, "sent")
	return nil
}

func (u *ActvUser) onGenerateNewMessage(S *session.Session, content string) (*session.Message, error) {
	var newMessage = session.Message{
		SessionId: S.Id,
		SenderId:  u.Id,
		Content:   content,
		Profile:   "openpgp", // this is a FixedVal for now, i'll change it later
	}
	// newSeq, err := db.AppModels.SessionModel.IncreaseMessageLastSeq(S.Id)
	// if err != nil {
	// 	return nil, err
	// }
	// newMessage.Seq = newSeq
	return &newMessage, nil
}

func (u *ActvUser) SendMessage(S *session.Session, content string) error {
	if u.Id != S.Alpha && u.Id != S.Beta {
		return errors.New("user is Not subscribed to this session")
	}
	newMessage, err := u.onGenerateNewMessage(S, content)

	sent := u.onDeliverMessage(S, newMessage)
	if !sent {
		err = db.AppModels.MessageModel.Insert(newMessage)
		// err = db.AppModels.MessageModel.SendMessage(&newMessage)
		if err != nil {
			return err
		}
	}
	return nil
}

func (u *ActvUser) onDeliverMessage(S *session.Session, message *session.Message) bool {
	var audienceId internal.UserId
	switch u.Id {
	case S.Alpha:
		audienceId = S.Beta
	case S.Beta:
		audienceId = S.Alpha
	}
	userOnlineConn, ok := GetConnByUserId(audienceId)
	if !ok {
		return false
	}
	body := envelope{"sessionId": S.Id, "messages": []*session.Message{message}}
	headers := RequestHeaders{"task": "add"}
	sendHandlerResponse(userOnlineConn, StatusPending, "messages", headers, body)
	return true
}

func (req *Request) onSendMessageEventResponce(sessionId internal.SessionId, messageEventId int, status string) {
	resp := envelope{"sessionId": sessionId, "messageEventId": messageEventId, "status": status}
	headers := RequestHeaders{"task": "event"}
	sendHandlerResponse(req.conn, StatusApproved, "messages", headers, resp)
}

func (req *Request) onSendSessionEventResponce(sessionEventId internal.SessionId, registeredSession *session.Session, audience *users.User, verified bool) {
	sendingSession := envelope{"sessionId": registeredSession.Id, "seq": registeredSession.Seq, "audience": internal.Audience{Name: audience.UserName,
		UserId:        audience.Id,
		DisplayId:     audience.DisplayId,
		ProfileAvatar: audience.ProfileAvatar,
		ArmedPubKey:   audience.PgpProfile.PublicKey}}

	resp := envelope{"sessionEventId": sessionEventId, "registeredSession": sendingSession, "verified": verified}
	headers := RequestHeaders{"task": "event"}
	sendHandlerResponse(req.conn, StatusApproved, "sessions", headers, resp)
}

// func (AU *ActvUser) DeleteSession(beta internal.UserId) error {
// 	Beta, err := users.GetUserProfile(beta)
// 	if err != nil {
// 		return loggy.Sayr("error while fetching beta for sending message", err)
// 	}
// 	sessionId, ok := AU.User.PgpProfile.Sessions[internal.UserId(beta)]
// 	if !ok {
// 		return loggy.Say("there was no Session found among these two audience")
// 	}
// 	sessionModel := pgp.SessionModel{
// 		DB: internal.App.Db,
// 	}
// 	err = sessionModel.Delete(sessionId)
// 	if err != nil {
// 		return err
// 	}
// 	delete(AU.User.PgpProfile.Sessions, Beta.PgpProfile.Id)
// 	delete(Beta.PgpProfile.Sessions, AU.User.PgpProfile.Id)
// 	ProfileModle := pgp.ProfileModel{
// 		DB: internal.App.Db,
// 	}
// 	for _, prf := range []*pgp.Profile{&AU.User.PgpProfile, &Beta.PgpProfile} {
// 		err = ProfileModle.Update(prf)
// 		if err != nil {
// 			return err
// 		}
// 	}
// 	return nil
// }

func (AU *ActvUser) GetSessionById(sessionId internal.SessionId) (*session.Session, error) {
	session, err := db.AppModels.SessionModel.Get(sessionId)
	if err != nil {
		return nil, loggy.Sayr("error while fetching session", err)
	}
	return session, nil
}
