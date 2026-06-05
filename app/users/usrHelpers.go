package users

import (
	"database/sql"
	"errors"
	"fmt"
	"marble/encryption/pgp"
	"marble/internal"
	"marble/internal/loggy"
)

// func (U *User) SetPgpAddress() {
// 	U.PgpProfile.Id = pgp.GetPgpAddress(U.UserName, U.Id)
// }

func (U *UserModel) Insert(user *User) error {
	query := `
	INSERT INTO users (user_name, email)
	VALUES ($1, $2)
	RETURNING 	id, display_id`
	args := []any{user.UserName, user.Email}
	err := U.DB.QueryRow(query, args...).Scan(&user.Id, &user.DisplayId)
	if err != nil {
		return fmt.Errorf("there was an error while Inserting the User-Information to DB: %v", err)
	}
	return nil
}

func (U *UserModel) Get(id internal.UserId) (*User, error) {
	if id < 1 {
		return nil, internal.ErrRecordNotFound
	}
	query := `SELECT id, email, user_name, display_id
			FROM users
			WHERE id = $1`
	var user User
	args := []any{&user.Id, &user.Email, &user.UserName, &user.DisplayId}
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
	// user.SetPgpAddress()
	// we can add the Address right here instead of in many other single function
	return &user, nil
}

func (U *UserModel) Update(user *User) error {
	query := `UPDATE users
			SET user_name = $2, email = $3, display_id = $4
			WHERE id = $1`
	args := []any{user.Id, user.UserName, user.Email, user.DisplayId}
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

func (U *UserModel) Delete(id internal.UserId) error {
	query := `DELETE FROM users
				WHERE id = $1`
	res, err := U.DB.Exec(query, id)
	if err != nil {
		return loggy.Sayr("an error while trying to delete the User data", err)
	}
	count, err := res.RowsAffected()
	if err != nil {
		return loggy.Sayr("the sql Driver might not support `RowsAffected()`", err)
	}
	if count != 1 {
		return internal.ErrRecordNotFound
	}
	return nil
}

func (U *UserModel) GetByDisplayId(dispayId string) (*User, error) {
	if dispayId == "" {
		return nil, internal.ErrRecordNotFound
	}
	query := `SELECT display_id, id, email, user_name
			FROM users
			WHERE display_id = $1`
	var user User
	args := []any{&user.DisplayId, &user.Id, &user.Email, &user.UserName}
	err := U.DB.QueryRow(query, dispayId).Scan(args...)
	if err != nil {
		switch {
		case errors.Is(err, sql.ErrNoRows):
			return nil, internal.ErrRecordNotFound
		default:
			return nil, loggy.Sayr("there was an error while fetching the User Data", err)
		}
	}

	pgpModel := pgp.ProfileModel{DB: U.DB}
	pgp_profile, err := pgpModel.Get(user.Id)
	if err != nil {
		return nil, loggy.Sayr("an error while getting the Pgp_profile", err)
	}
	user.PgpProfile = *pgp_profile
	//Fetching and adding the Pgp_session Part
	// user.SetPgpAddress()
	// we can add the Address right here instead of in many other single function
	return &user, nil
}
