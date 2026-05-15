package active

import (
	"marble/app/users"
	"marble/encryption/pgp"
	"marble/internal"
	"marble/internal/loggy"
)

func (AU *ActvUser) CreateSession(beta internal.UserId, message string) error {
	// AU.User.SetPgpAddress()
	// fmt.Println(*(AU.User))
	Beta, err := users.GetUserProfile(beta)
	if err != nil {
		return err
	}
	// fmt.Println(*Beta)
	_, err = AU.User.PgpProfile.CreateSession(&Beta.PgpProfile, message)
	if err != nil {
		return err
	}
	// we can add a notif for reading the sgined messages on beta's Reading message side...
	return nil
}

func (AU *ActvUser) SendSessionMessage(beta internal.UserId, message string) error {
	Beta, err := users.GetUserProfile(beta)
	if err != nil {
		return loggy.Sayr("error while fetching beta for sending message", err)
	}
	session, err := AU.GetActiveSession(beta)
	if err != nil {
		return err
	}
	return AU.User.PgpProfile.SendMessage(&Beta.PgpProfile, session, message)
}

func (AU *ActvUser) ReadSessionMessage(beta internal.UserId, from, count int) (*[]string, int, error) {
	Beta, err := users.GetUserProfile(beta)
	if err != nil {
		return nil, -1, loggy.Sayr("error while fetching beta for sending message", err)
	}
	session, err := AU.GetActiveSession(beta)
	if err != nil {
		return nil, -1, err
	}
	res, lastIndex, err := AU.User.PgpProfile.ReadMessage(&Beta.PgpProfile, session, from, count)
	if err != nil {
		return nil, -1, loggy.Sayr("an error while reading the message from session", err)
	}
	return res, lastIndex, nil
}

func (AU *ActvUser) DeleteSession(beta internal.UserId) error {
	Beta, err := users.GetUserProfile(beta)
	if err != nil {
		return loggy.Sayr("error while fetching beta for sending message", err)
	}
	sessionId, ok := AU.User.PgpProfile.Sessions[internal.UserId(beta)]
	if !ok {
		return loggy.Say("there was no Session found among these two audience")
	}
	sessionModel := pgp.SessionModel{
		DB: internal.App.Db,
	}
	err = sessionModel.Delete(sessionId)
	if err != nil {
		return err
	}
	delete(AU.User.PgpProfile.Sessions, Beta.PgpProfile.Id)
	delete(Beta.PgpProfile.Sessions, AU.User.PgpProfile.Id)
	ProfileModle := pgp.ProfileModel{
		DB: internal.App.Db,
	}
	for _, prf := range []*pgp.Profile{&AU.User.PgpProfile, &Beta.PgpProfile} {
		err = ProfileModle.Update(prf)
		if err != nil {
			return err
		}
	}
	return nil
}

func (AU *ActvUser) GetActiveSession(beta internal.UserId) (*pgp.Session, error) {
	sessionId, ok := AU.User.PgpProfile.Sessions[internal.UserId(beta)]
	if !ok {
		return nil, loggy.Say("there was no Session found among these two audience")
	}
	model := pgp.SessionModel{
		DB: internal.App.Db,
	}
	session, err := model.Get(sessionId)
	if err != nil {
		return nil, loggy.Sayr("error while fetching session", err)
	}
	return session, nil
}
