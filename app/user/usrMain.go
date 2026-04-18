package user

import (
	"marble/encryption/pgp"
	"marble/internal/log"
	"math/rand"

	"github.com/ProtonMail/gopenpgp/v3/crypto"
)

var logger = log.DefultErrorLog

/* 
isn't it Obvious??
 */
func CreateNewUser(username, email, password string) (*User, *crypto.Key, error) {
	// check valid Email
	newUser := User{
		UserName: username,
		Email:    email,
		Id:       rand.Uint32(),
	}
	for false {
		newUser.Id = rand.Uint32()
	}
	authorizationKey, err := pgp.GenAuthKey(password)
	if err != nil {
		return &User{}, nil, err
	}
	newUser.pgpProfile.AuthKey = authorizationKey

	identityKey, err := pgp.GenPrivateKey()
	if err != nil {
		return &User{}, nil, err
	}
	newUser.pgpProfile.PubIdentityKey, err = identityKey.GetArmoredPublicKey()
	if err != nil {
		return &User{}, nil, err
	}
	newUser.pgpProfile.Adress = pgp.GetAdress(username, newUser.Id)
	newUser.pgpProfile.Sesions = map[pgp.ProfileAdress]uint64{}
	err = newUser.Save()
	if err != nil {
		return &User{}, nil, err
	}
	return &newUser, identityKey, nil

}

/* 
GetActiveUser adds the Users to a Online Client Session to
keep it in use for next Requests & tasks
 */
func GetActiveUser(pgp.ProfileAdress, ) (*ActiveUser, error) {
	newActiveUser := ActiveUser{

	}
	return &newActiveUser, nil
}

/* 
GetUserProfile finds the Betas profile among the Db for
Session Tasks or etc.
 */
func GetUserProfile(adress string) (*User, error) {
	name, id, err := pgp.IsvalidAdress(adress)
	if err != nil {
		return nil, err
	}

	user := User{UserName: name, Id: id} // Database hook

	return &user, nil
}

/* 
an Active User can CreateSession by passing the Audience as an adress
along with the Session-Starting-message;
CreateSession checks for the betas Profile among the Db and
if Beta was found it creates a new Session;
the detaled tasks like checking for blocked Users and managing 
Session&signature verifiers will happen here.  
 */
func (AU *ActiveUser) CreateSession(betaAdress, message string) error {
	Beta, err := GetUserProfile(betaAdress)
	if err != nil {
		return err
	}
	_, err = AU.pgpProfile.
		CreateSession(*AU.PrvIdentityKey, &Beta.pgpProfile, message)
	if err != nil {
		return err
	}
	// we can add a notif for reading the sgined messages on beta's Reading message side...
	return nil
}

/* 
Db call-work of Saving a User
 */
func (U *User) Save() error {
	return nil
}
