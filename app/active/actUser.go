package active

import (
	"marble/app/users"
	"marble/encryption/pgp"
	"marble/internal"
	"marble/internal/loggy"

	"github.com/ProtonMail/gopenpgp/v3/crypto"
)

type ActvUser struct {
	PrvIdentityKey *crypto.Key
	User           *users.User
}

/*
an Active User can CreateSession by passing the Audience as an address
along with the Session-Starting-message;
CreateSession checks for the betas Profile among the Db and
if Beta was found it creates a new Session;
the detaled tasks like checking for blocked Users and managing
Session&signature verifiers will happen here.
*/
func (AU *ActvUser) CreateSession(beta pgp.Profileaddress, message string) error {
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

func (AU *ActvUser) SendSessionMessage(beta pgp.Profileaddress, message string) error {
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

func (AU *ActvUser) ReadSessionMessage(beta pgp.Profileaddress, from, count int) (*[]string, int, error) {
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

func (AU *ActvUser) DeleteSession(beta pgp.Profileaddress) error {
	Beta, err := users.GetUserProfile(beta)
	if err != nil {
		return loggy.Sayr("error while fetching beta for sending message", err)
	}
	sessionId, ok := AU.User.PgpProfile.Sessions[pgp.Profileaddress(beta)]
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
	delete(AU.User.PgpProfile.Sessions, Beta.PgpProfile.Address)
	delete(Beta.PgpProfile.Sessions, AU.User.PgpProfile.Address)
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

func (AU *ActvUser) GetActiveSession(beta pgp.Profileaddress) (*pgp.Session, error) {
	sessionId, ok := AU.User.PgpProfile.Sessions[pgp.Profileaddress(beta)]
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

/*
GetActiveUser adds the Users to a Online Client Session to
keep it in use for next Requests & tasks
*/
func GetActiveUser(userAddress pgp.Profileaddress) (*ActvUser, error) {
	newActiveUser := ActvUser{}
	var err error
	newActiveUser.User, err = users.GetUserProfile(userAddress)
	if err != nil {
		return nil, err
	}
	return &newActiveUser, nil
}
