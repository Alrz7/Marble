package active

import (
	"marble/internal"
)

// there should be a Fast & responsive In-memmory storage for adding the active users
// an active-User is typically an Online User which has previously used the api after
// the aouthentication.
// the active DB is going to be simple and In-memmory UNTIl i implement the main User-Auth
// and then we will switch on an official DB like Redis.
var db = map[internal.UserId]*ActvUser{}

func Insert(AU *ActvUser) {
	db[AU.User.Id] = AU
	// loggy.DefaultLogger.Info(fmt.Sprintf("a successful login-activation for %v", AU.User.PgpProfile.Address))
	// return nil
}

func Get(id internal.UserId) (*ActvUser, error) {
	res, ok := db[id]
	if ok {
		return res, nil
	}
	return nil, internal.ErrRecordNotFound
}

func Update(AU *ActvUser) {
	db[AU.User.Id] = AU
	// return nil
}

func Delete(id internal.UserId) {
	delete(db, id)
	// return nil
}
