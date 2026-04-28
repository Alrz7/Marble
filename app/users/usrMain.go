package users

import (
	"errors"
	"marble/encryption/pgp"
	"marble/internal"
	"marble/internal/loggy"

	"github.com/ProtonMail/gopenpgp/v3/crypto"
)

var logger = loggy.DefaultLogger

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
		return &User{}, nil, err
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
	newUser.PgpProfile.Sessions = map[pgp.Profileaddress]int64{}
	err = newUser.Save()
	if err != nil {
		return &User{}, nil, err
	}
	newUser.SetPgpAdress()
	return &newUser, identityKey, nil

}

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
	return nil
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
	Mod := UserModel{DB: internal.App.Db}
	user, err := Mod.Get(id)
	if err != nil {
		switch {
		case errors.Is(err, internal.ErrRecordNotFound):
			return nil, loggy.Sayr("could not find the User in Temprorry Storage", err)
		default:
			return nil, loggy.Sayr("an error while trying to find the User in DB", err)
		}
	}
	return user, nil
}
