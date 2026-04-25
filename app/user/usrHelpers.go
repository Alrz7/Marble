package user

import (
	"fmt"
	"marble/encryption/pgp"
)

func (U *User) SetPgpAdress() {
	U.PgpProfile.Address = pgp.GetPgpAddress(U.UserName, U.Id)
}

func (U *UserModel) Insert(user *User) error {
	query := `
	INSERT INTO users (user_name, email)
	VALUES ($1, $2)
	RETURNING 	id`
	args := []any{user.UserName, user.Email}
	err := U.DB.QueryRow(query, args...).Scan(&user.Id)
	if err != nil {
		return fmt.Errorf("there was an error while Inserting the User-Information to DB: %v", err)
	}
	return nil
}

func (U *UserModel) Get(id uint64) (*User, error) {
	// AU.User.SetPgpAdress()
	// we can add the Address right here instead of in many other single function
	return nil, nil
}

func (U *UserModel) Update(user *User) error {
	return nil
}

func (U *UserModel) Delete(id uint64) error {
	return nil
}
