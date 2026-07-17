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
		AudienceId int    `json:"audienceId"`
		Content    string `json:"content"`
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
	err = req.user.SendMessage(newSession, entry.Content)
	if err != nil {
		return err
	}
	// we can add a notif for reading the sgined messages on beta's Reading message side...
	req.user.OnAddSession(req.conn, newSession, Beta)
	req.user.onDeliverSession(newSession, Beta)
	return nil
}

func (u *ActvUser) onDeliverSession(session *session.Session, audience *users.User) {
	userOnlineConn, ok := GetConnByUserId(audience.Id)
	if !ok {
		return
	}
	u.OnAddSession(userOnlineConn, session, u.User)
}

func (u *ActvUser) OnAddSession(conn *websocket.Conn, session *session.Session, audience *users.User) {

	sendingSession := envelope{"sessionId": session.Id, "seq": session.Seq, "audience": internal.Audience{Name: audience.UserName,
		UserId:        audience.Id,
		DisplayId:     audience.DisplayId,
		ProfileAvatar: audience.ProfileAvatar,
		ArmedPubKey:   audience.PgpProfile.PublicKey}}

	Body := envelope{"sessions": []*envelope{&sendingSession}}
	headers := RequestHeaders{"task": "add"}
	sendHandlerResponse(conn, StatusPending, "sessions", headers, Body)
}

// --- Messages ---
func HndlSendMesage(req *Request) error {
	entry := struct {
		AudienceId internal.UserId `json:"audienceId"`
		SessionId  uint64          `json:"sessionId"`
		Message    string          `json:"message"`
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
	return req.user.SendMessage(session, entry.Message)
}

func (u *ActvUser) SendMessage(S *session.Session, content string) error {
	var newMessage = session.Message{
		SessionId: S.Id,
		Content:   content,
		Profile:   "openpgp", // this is a FixedVal for now, i'll change it later
	}
	if u.Id == S.Alpha || u.Id == S.Beta {
		newMessage.SenderId = u.Id
		newSeq, err := db.AppModels.SessionModel.IncreaseMessageLastSeq(S.Id)
		if err != nil {
			return err
		}

		newMessage.Seq = newSeq
		sent := u.onDeliverMessage(S, &newMessage)
		if !sent {
			err = db.AppModels.MessageModel.Insert(&newMessage)
			// err = db.AppModels.MessageModel.SendMessage(&newMessage)
			if err != nil {
				return err
			}
		}

	} else {
		return errors.New("There was a mismatch among audiences while sending message")
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
