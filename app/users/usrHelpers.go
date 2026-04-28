package users

import (
	"database/sql"
	"errors"
	"fmt"
	"marble/encryption/pgp"
	"marble/internal"
	"marble/internal/loggy"
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

func (U *UserModel) Get(id int32) (*User, error) {
	if id < 1 {
		return nil, internal.ErrRecordNotFound
	}
	query := `SELECT id, email, user_name
			FROM users
			WHERE id = $1`
	var user User
	args := []any{&user.Id, &user.Email, &user.UserName}
	err := U.DB.QueryRow(query, id).Scan(args...)
	if err != nil {
		switch {
		case errors.Is(err, sql.ErrNoRows):
			return nil, internal.ErrRecordNotFound
		default:
			return nil, loggy.Sayr("there was an error while fetching the User Data", err)
		}
	}
	pgpModel := pgp.ProfileModel{DB: U.DB}
	pgp_profile, err := pgpModel.Get(id)
	if err != nil {
		return nil, loggy.Sayr("an error while getting the Pgp_profile", err)
	}
	user.PgpProfile = *pgp_profile
	//Fetching and adding the Pgp_session Part
	user.SetPgpAdress()
	// we can add the Address right here instead of in many other single function
	return &user, nil
}

func (U *UserModel) Update(user *User) error {
	query := `UPDATE users
			SET user_name = $1, email = $2
			WHERE id = $3`
	args := []any{user.UserName, user.Email, user.Id}
	_, err := U.DB.Exec(query, args...)
	if err != nil {
		switch {
		case errors.Is(err, sql.ErrNoRows):
			return internal.ErrRecordNotFound
		default:
			return loggy.Sayr("there was an error while Updating User Data", err)
		}
	}
	return nil
}

func (U *UserModel) Delete(id int32) error {
	return nil
}
