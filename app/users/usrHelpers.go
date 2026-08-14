package users

import (
	"database/sql"
	"errors"
	"fmt"
	"marble/enc/pgp"
	"marble/internal"
	"marble/internal/loggy"
)

// func (U *User) SetPgpAddress() {
// 	U.PgpProfile.Id = pgp.GetPgpAddress(U.UserName, U.Id)
// }

func (m UserModel) Insert(user *User, passwordHash string) error {
	query := `
	INSERT INTO users (name, email, display_id, auth_hash)
	VALUES ($1, $2, $3, $4)
	RETURNING 	id, display_id`
	args := []any{user.UserName, user.Email, user.DisplayId, passwordHash}
	err := m.Db.QueryRow(query, args...).Scan(&user.Id, &user.DisplayId)
	if err != nil {
		return fmt.Errorf("there was an error while Inserting the User-Information to DB: %v", err)
	}
	return nil
}

func (m UserModel) SetUserRefreshToken(id internal.UserId, token string) error {
	query := `UPDATE users
	SET refresh_token = $2
	WHERE id = $1`
	args := []any{id, token}
	_, err := m.Db.Exec(query, args...)
	if err != nil {
		return fmt.Errorf("there was an error while Updating the User-RefreshToken to DB: %v", err)
	}
	return nil
}

func (m UserModel) GetUserRefreshToken(id internal.UserId) (string, error) {
	var res string
	query := `SELECT refresh_token FROM users WHERE id = $1`
	args := []any{&res}
	err := m.Db.QueryRow(query, id).Scan(args...)
	if err != nil {
		switch {
		case errors.Is(err, sql.ErrNoRows):
			return "", loggy.NewAppErr(loggy.ErrNoRecord)
		default:
			return "", loggy.EchoWithMessage("there was an error while fetching the User refreshToken", err)
		}
	}
	return res, nil
}

func (m UserModel) GetUserAuthHash(id internal.UserId) (string, error) {
	var res string
	query := `SELECT auth_hash FROM users WHERE id = $1`
	args := []any{&res}
	err := m.Db.QueryRow(query, id).Scan(args...)
	if err != nil {
		switch {
		case errors.Is(err, sql.ErrNoRows):
			return "", loggy.NewAppErr(loggy.ErrNoRecord)
		default:
			return "", loggy.EchoWithMessage("there was an error while fetching the User AuthHash", err)
		}
	}
	return res, nil
}

func (m UserModel) Get(id internal.UserId) (*User, error) {
	if id < 1 {
		return nil, loggy.NewAppErr(loggy.ErrNoRecord)
	}
	query := `SELECT id, email, name, display_id, session_last_seq
			FROM users
			WHERE id = $1`
	var user User
	args := []any{&user.Id, &user.Email, &user.UserName, &user.DisplayId, &user.SessionLastSeq}
	err := m.Db.QueryRow(query, id).Scan(args...)
	if err != nil {
		switch {
		case errors.Is(err, sql.ErrNoRows):
			return nil, loggy.NewAppErr(loggy.ErrNoRecord)
		default:
			return nil, loggy.EchoWithMessage("there was an error while fetching the User Data", err)
		}
	}
	pgpModel := pgp.ProfileModel{Db: m.Db}
	pgp_profile, err := pgpModel.Get(id)
	if err != nil {
		return nil, loggy.EchoWithMessage("an error while getting the Pgp_profile", err)
	}
	user.PgpProfile = *pgp_profile
	//Fetching and adding the Pgp_session Part
	// user.SetPgpAddress()
	// we can add the Address right here instead of in many other single function
	return &user, nil
}

func (m UserModel) Update(user *User) error {
	query := `UPDATE users
			SET name = $2, email = $3, display_id = $4
			WHERE id = $1`
	args := []any{user.Id, user.UserName, user.Email, user.DisplayId}
	_, err := m.Db.Exec(query, args...)
	if err != nil {
		switch {
		case errors.Is(err, sql.ErrNoRows):
			return loggy.NewAppErr(loggy.ErrNoRecord)
		default:
			return loggy.EchoWithMessage("there was an error while Updating User Data", err)
		}
	}
	return nil
}

func (m UserModel) IncreaseSessionLastSeq(userId internal.UserId) (int, error) {
	var res int
	query := `UPDATE users
SET
  session_last_seq = session_last_seq + 1
WHERE
  id = $1
RETURNING
  session_last_seq;`
	err := m.Db.QueryRow(query, userId).Scan(&res)
	if err != nil {
		return -1, err
	}
	return res, nil
}

func (m UserModel) Delete(id internal.UserId) error {
	query := `DELETE FROM users
				WHERE id = $1`
	res, err := m.Db.Exec(query, id)
	if err != nil {
		return loggy.EchoWithMessage("an error while trying to delete the User data", err)
	}
	count, err := res.RowsAffected()
	if err != nil {
		return loggy.EchoWithMessage("the sql Driver might not support `RowsAffected()`", err)
	}
	if count != 1 {
		return loggy.NewAppErr(loggy.ErrNoRecord)
	}
	return nil
}

func (m UserModel) GetByDisplayId(dispayId string) (*User, error) {
	if dispayId == "" {
		return nil, loggy.NewAppErr(loggy.ErrNoRecord)
	}
	query := `SELECT display_id, id, email, name
			FROM users
			WHERE display_id = $1`
	var user User
	args := []any{&user.DisplayId, &user.Id, &user.Email, &user.UserName}
	err := m.Db.QueryRow(query, dispayId).Scan(args...)
	if err != nil {
		switch {
		case errors.Is(err, sql.ErrNoRows):
			return nil, loggy.NewAppErr(loggy.ErrNoRecord)
		default:
			return nil, loggy.EchoWithMessage("there was an error while fetching the User Data", err)
		}
	}

	pgpModel := pgp.ProfileModel{Db: m.Db}
	pgp_profile, err := pgpModel.Get(user.Id)
	if err != nil {
		return nil, loggy.EchoWithMessage("an error while getting the Pgp_profile", err)
	}
	user.PgpProfile = *pgp_profile
	//Fetching and adding the Pgp_session Part
	// user.SetPgpAddress()
	// we can add the Address right here instead of in many other single function
	return &user, nil
}
