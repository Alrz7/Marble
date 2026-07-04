package users

import (
	"errors"
	"marble/encryption/pgp"
	"marble/internal"
	"marble/internal/loggy"
)

var logger = loggy.DefaultLogger

func CreateNewUser(username, email, password string, pubIdentKey string) (*User, error) {
	// check valid Email
	newUser := User{
		UserName: username,
		Email:    email,
	}
	authorizationKey, err := pgp.GenAuthKey(password)
	if err != nil {
		return &User{}, err
	}
	newUser.PgpProfile.AuthKey = authorizationKey // this is good aproach But it costs alot of memory
	// and speed so im going to replace this with the standard auth methods.

	newUser.PgpProfile.PublicKey = pubIdentKey

	return &newUser, nil

}

func (U *User) fakeSave() error {
	U.Id = 2
	U.DisplayId = "u2"
	U.PgpProfile.UserId = 2
	return nil
}

func (U *User) Save(UModel UserModel, PModel pgp.ProfileModel) error {
	err := UModel.Insert(U)
	if err != nil {
		return err
	}
	err = PModel.Insert(&U.PgpProfile, U.Id)
	if err != nil {
		return err
	}
	return nil
}

/*
GetUserProfile finds the User's profile among the Db for
Session Tasks or etc.
*/
func (m UserModel) GetUserProfile(id internal.UserId) (*User, error) {
	// Mod := UserModel{DB: internal.App.Db}
	user, err := m.Get(id)
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
