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
func (AU *ActvUser) CreateSession(beta, message string) error {
	// AU.User.SetPgpAdress()
	// fmt.Println(*(AU.User))
	Beta, err := users.GetUserProfile(beta)
	if err != nil {
		return err
	}
	// fmt.Println(*Beta)
	_, err = AU.User.PgpProfile.
		CreateSession(*AU.PrvIdentityKey, &Beta.PgpProfile, message)
	if err != nil {
		return err
	}
	// we can add a notif for reading the sgined messages on beta's Reading message side...
	return nil
}

func (AU *ActvUser) SendSessionMessage(beta string, message string) error {
	Beta, err := users.GetUserProfile(beta)
	if err != nil {
		return loggy.Sayr("error while fetching beta for sending message", err)
	}
	// loggy.DefaultLogger.Info(AU.User.PgpProfile.Sessions)
	// loggy.DefaultLogger.Info(pgp.Profileaddress(beta))
	// loggy.DefaultLogger.Info(AU.User.PgpProfile)

	sessionId, ok := AU.User.PgpProfile.Sessions[pgp.Profileaddress(beta)]
	if !ok {
		return loggy.Say("there was no Session found among these two audience")
	}
	sessionMod := pgp.SessionModel{DB: internal.App.Db}
	session, err := sessionMod.Get(sessionId)
	if err != nil {
		return loggy.Sayr("error while fetching session", err)
	}
	return AU.User.PgpProfile.SendMessage(*AU.PrvIdentityKey, &Beta.PgpProfile, session, message)
}

/*
GetActiveUser adds the Users to a Online Client Session to
keep it in use for next Requests & tasks
*/
func GetActiveUser(betaAddrs string) (*ActvUser, error) {
	newActiveUser := ActvUser{}
	var err error
	newActiveUser.User, err = users.GetUserProfile(betaAddrs)
	if err != nil {
		return nil, err
	}
	return &newActiveUser, nil
}
