package users

import (
	"marble/enc/pgp"
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

func (U *User) fakeSave() error {
	U.Id = 2
	U.DisplayId = "u2"
	U.PgpProfile.UserId = 2
	return nil
}
