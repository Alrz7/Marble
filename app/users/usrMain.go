package users

import (
	"context"
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

func (U *User) Save(ctx context.Context, UModel UserModel, userAuthKey string, PModel pgp.ProfileModel) error {
	err := UModel.Insert(ctx, U, userAuthKey)
	if err != nil {
		return err
	}
	err = PModel.Insert(ctx, &U.PgpProfile, U.Id)
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
