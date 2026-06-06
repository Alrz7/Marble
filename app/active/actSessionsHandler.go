package active

import (
	"encoding/json"
	"marble/app/users"
	"marble/encryption/pgp"
	"marble/internal"
	"marble/internal/loggy"
)

func HndlCreateSession(req *Request) error {
	entry := struct {
		AudienceId  int    `json:"audienceId"`
		Content string `json:"content"`
	}{}
	err := json.Unmarshal([]byte(req.Body), &entry)
	if err != nil {
		actBadRequestResponse(req.conn, err)
		return err
	}

	Beta, err := users.GetUserProfile(internal.UserId(entry.AudienceId))
	if err != nil {
		actNotFoundResponse(req.conn, err)
		return err
	}
	_, err = req.user.PgpProfile.CreateSession(&Beta.PgpProfile, entry.Content)
	if err != nil {
		actServerErrorResponse(req.conn, err)
		return err
	}
	// we can add a notif for reading the sgined messages on beta's Reading message side...
	return nil
}

/*
Handles `onSyncSession` requests.
*/
func HndlSyncSessions(req *Request) {
	entry := struct {
		ClientExistingSessions existingAudiences `json:"existingSessions"`
	}{}
	err := json.Unmarshal([]byte(req.Body), &entry)
	if err != nil {
		actBadRequestResponse(req.conn, err)
	}
	RemainingUsers, err := returnUnsyncedSessions(req.user.PgpProfile.Sessions, entry.ClientExistingSessions)
	if err != nil {
		actServerErrorResponse(req.conn, err)
	}
	body := envelope{"sessions": RemainingUsers}
	headers := RequestHeaders{"task": "add"}
	sendHandlerResponse(req.conn, StatusApproved, "sessions", headers, body)
}

// --- Messages ---
func HndlSendMesage(req *Request) error {
	entry := struct {
		AudienceId  internal.UserId `json:"audienceId"`
		SessionId uint64          `json:"sessionId"`
		Message   string          `json:"message"`
	}{}
	err := json.Unmarshal([]byte(req.Body), &entry)
	if err != nil {
		actBadRequestResponse(req.conn, err)
		return err
	}

	Beta, err := users.GetUserProfile(entry.AudienceId)
	if err != nil {
		actNotFoundResponse(req.conn, err)
		return err
	}
	session, err := req.user.GetActiveSession(internal.SessionId(entry.SessionId))
	if err != nil {
		actNotFoundResponse(req.conn, err)
		return err
	}
	return req.user.PgpProfile.SendMessage(&Beta.PgpProfile, session, entry.Message)
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

func (AU *ActvUser) GetActiveSession(sessionId internal.SessionId) (*pgp.Session, error) {
	model := pgp.SessionModel{
		DB: internal.App.Db,
	}
	session, err := model.Get(sessionId)
	if err != nil {
		return nil, loggy.Sayr("error while fetching session", err)
	}
	return session, nil
}
