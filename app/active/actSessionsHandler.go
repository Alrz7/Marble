package active

import (
	"encoding/json"
	"errors"
	"marble/app/session"
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
	newSession, err := req.user.CreateSession(Beta.Id, entry.Content)
	if err != nil {
		actServerErrorResponse(req.conn, err)
		return err
	}
	// we can add a notif for reading the sgined messages on beta's Reading message side...
	req.user.OnAddSession(req.conn, []*session.Session{newSession})
	return nil
}

func (u *ActvUser) CreateSession(betaId internal.UserId, content string) (*session.Session, error) {
	session, err := db.AppModels.SessionModel.CreateSession(u.Id, betaId)
	if err != nil {
		return nil, err
	}
	err = u.SendMessage(session, content)
	if err != nil {
		return nil, err
	}
	return session, nil
}

func (u *ActvUser) OnAddSession(conn *websocket.Conn, sessions []*session.Session) {
	addingSessions := []envelope{}
	for _, session := range sessions {
		audience, err := db.AppModels.UserModel.GetUserProfile(session.Beta)
		if err != nil {
			actNotFoundResponse(conn, err)
		}

		newSession := envelope{"sessionId": session.Id, "audience": Audience{audience.UserName,
			audience.Id,
			audience.DisplayId,
			"",
			audience.PgpProfile.PublicKey}}
		addingSessions = append(addingSessions, newSession)
	}
	Body := envelope{"sessions": addingSessions}
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
	session, err := req.user.GetActiveSession(internal.SessionId(entry.SessionId))
	if err != nil {
		actNotFoundResponse(req.conn, err)
		return err
	}
	return req.user.SendMessage(session, entry.Message)
}

func (u *ActvUser) SendMessage(S *session.Session, message string) error {
	var newMessage = session.Message{
		SessionId: S.Id,
		Content:   message,
		Profile:   "openpgp", // this is a FixedVal for now, i'll change it later
	}
	if u.Id == S.Alpha || u.Id == S.Beta {
		newMessage.SenderId = u.Id
		newSeq, err := db.AppModels.SessionModel.IncreaseSessionSequence(S.Id)
		if err != nil {
			return err
		}
		newMessage.Seq = newSeq
		err = db.AppModels.MessageModel.SendMessage(&newMessage)
		if err != nil {
			return err
		}
	} else {
		return errors.New("There was a mismatch among audiences while sending message")
	}
	return nil
}

// func (AU *ActvUser) ReadSessionMessage(beta internal.UserId, from, count int) (*[]string, int, error) {
// 	Beta, err := users.GetUserProfile(beta)
// 	if err != nil {
// 		return nil, -1, loggy.Sayr("error while fetching beta for sending message", err)
// 	}
// 	session, err := AU.GetActiveSession(beta)
// 	if err != nil {
// 		return nil, -1, err
// 	}
// 	res, lastIndex, err := AU.User.PgpProfile.ReadMessage(&Beta.PgpProfile, session, from, count)
// 	if err != nil {
// 		return nil, -1, loggy.Sayr("an error while reading the message from session", err)
// 	}
// 	return res, lastIndex, nil
// }

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

func (AU *ActvUser) GetActiveSession(sessionId internal.SessionId) (*session.Session, error) {

	session, err := db.AppModels.SessionModel.Get(sessionId)
	if err != nil {
		return nil, loggy.Sayr("error while fetching session", err)
	}
	return session, nil
}
