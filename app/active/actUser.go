package active

import (
	"marble/app/users"
	"marble/db"
	"marble/internal"
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
	*users.User
	//...
}

/*
GetActiveUser adds the Users to a Online Client Session to
keep it in use for next Requests & tasks
*/
func GetActiveUser(userId internal.UserId) (*ActvUser, error) {
	newActiveUser := ActvUser{}
	var err error
	newActiveUser.User, err = db.AppModels.UserModel.GetUserProfile(userId)
	if err != nil {
		return nil, err
	}
	return &newActiveUser, nil
}
