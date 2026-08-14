package users

import (
	"errors"
	"marble/enc/pgp"
	"marble/internal"
	"marble/internal/loggy"
)

var logger = loggy.DefaultZapLogger

func CreateNewUser(username, email, DisplayId string, pubIdentKey string) (*User, error) {
	// check valid Email
	newUser := User{
		UserName:  username,
		Email:     email,
		DisplayId: DisplayId,
	}
	newUser.PgpProfile.PublicKey = pubIdentKey

	return &newUser, nil
}

func (U *User) fakeSave() error {
	U.Id = 2
	U.DisplayId = "u2"
	U.PgpProfile.UserId = 2
	return nil
}

func (U *User) Save(UModel UserModel, userAuthKey string, PModel pgp.ProfileModel) error {
	err := UModel.Insert(U, userAuthKey)
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
		case errors.Is(err, loggy.NewAppErr(loggy.ErrNoRecord)):
			return nil, loggy.EchoWithMessage("could not find the User in Temprorry Storage", err)
		default:
			return nil, loggy.EchoWithMessage("an error while trying to find the User in DB", err)
		}
	}
	return user, nil
}
