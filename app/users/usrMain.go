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

	newUser.PgpProfile.PubIdentityKey = pubIdentKey

	newUser.PgpProfile.Sessions = map[internal.UserId]int64{}
	err = newUser.Save()
	// err = newUser.fakeSave()
	if err != nil {
		return &User{}, err
	}
	// newUser.SetPgpAddress()
	return &newUser, nil

}

func (U *User) fakeSave() error {
	U.Id = 2
	U.DisplayId = "U_2"
	U.PgpProfile.Id = 2
	// U.PgpProfile.Address = pgp.GetPgpAddress(U.UserName, U.Id)
	return nil
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
GetUserProfile finds the User's profile among the Db for
Session Tasks or etc.
*/
func GetUserProfile(id internal.UserId) (*User, error) {
	// _, id, err := pgp.IsvalidAddress(string(address))
	// if err != nil {
	// 	return nil, err
	// }
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
