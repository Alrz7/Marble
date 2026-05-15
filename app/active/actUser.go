package active

import (
	"marble/app/users"
	"github.com/ProtonMail/gopenpgp/v3/crypto"
)

/*
an Active User can CreateSession by passing the Audience as an address
along with the Session-Starting-message;
CreateSession checks for the betas Profile among the Db and
if Beta was found it creates a new Session;
the detaled tasks like checking for blocked Users and managing
Session&signature verifiers will happen here.
*/
type ActvUser struct {
	PrvIdentityKey *crypto.Key
	User           *users.User
}

/*
GetActiveUser adds the Users to a Online Client Session to
keep it in use for next Requests & tasks
*/
func GetActiveUser(userAddress int32) (*ActvUser, error) {
	newActiveUser := ActvUser{}
	var err error
	newActiveUser.User, err = users.GetUserProfile(userAddress)
	if err != nil {
		return nil, err
	}
	return &newActiveUser, nil
}
