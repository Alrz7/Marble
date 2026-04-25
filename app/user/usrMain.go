package user

import (
	"errors"
	"marble/encryption/pgp"
	"marble/internal"
	"marble/internal/log"

	"github.com/ProtonMail/gopenpgp/v3/crypto"
)

var errlogger = log.DefultErrorLog
var inflogger = log.DefultInfoLog

/*
isn't it Obvious??
*/
func CreateNewUser(username, email, password string) (*User, *crypto.Key, error) {
	// check valid Email
	newUser := User{
		UserName: username,
		Email:    email,
	}
	authorizationKey, err := pgp.GenAuthKey(password)
	if err != nil {
		return &User{}, nil, errlogger.Output(2, err.Error())
	}
	newUser.PgpProfile.AuthKey = authorizationKey

	identityKey, err := pgp.GenPrivateKey()
	if err != nil {
		return &User{}, nil, err
	}
	newUser.PgpProfile.PubIdentityKey, err = identityKey.GetArmoredPublicKey()
	if err != nil {
		return &User{}, nil, err
	}
	newUser.PgpProfile.Sessions = map[pgp.Profileaddress]uint64{}
	err = newUser.Save()
	if err != nil {
		return &User{}, nil, err
	}
	newUser.SetPgpAdress()
	return &newUser, identityKey, nil

}

// tempIn-memmory User saving
var Users []User = []User{}

func (U *User) Save() error {
	UsrModel := UserModel{
		DB: internal.App.Db,
	}
	PrfModel := pgp.ProfileModel{
		DB: internal.App.Db,
	}
	err := UsrModel.Insert(U)
	if err != nil {
		return err
	}
	err = PrfModel.Insert(&U.PgpProfile, U.Id)
	if err != nil {
		return err
	}
	Users = append(Users, *U)
	return nil
}

/*
GetActiveUser adds the Users to a Online Client Session to
keep it in use for next Requests & tasks
*/
func GetActiveUser(add string) (*ActiveUser, error) {
	newActiveUser := ActiveUser{}
	var err error
	newActiveUser.User, err = GetUserProfile(add)
	if err != nil {
		return nil, err
	}
	return &newActiveUser, nil
}

/*
GetUserProfile finds the Betas profile among the Db for
Session Tasks or etc.
*/
func GetUserProfile(address string) (*User, error) {
	_, id, err := pgp.IsvalidAddress(address)
	if err != nil {
		return nil, err
	}
	// user := User{UserName: name, Id: id} // Database hook
	for _, user := range Users {
		if user.Id == id {
			user.SetPgpAdress()
			return &user, nil
		}
	}
	return nil, errors.New("could not find the User in Temprorry Storage")
}

/*
an Active User can CreateSession by passing the Audience as an address
along with the Session-Starting-message;
CreateSession checks for the betas Profile among the Db and
if Beta was found it creates a new Session;
the detaled tasks like checking for blocked Users and managing
Session&signature verifiers will happen here.
*/
func (AU *ActiveUser) CreateSession(beta, message string) error {
	// AU.User.SetPgpAdress()
	// fmt.Println(*(AU.User))
	Beta, err := GetUserProfile(beta)
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
