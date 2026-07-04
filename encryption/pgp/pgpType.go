package pgp

import (
	"database/sql"
	"errors"
	"fmt"
	"marble/internal"
	"marble/internal/loggy"
)

type Profile struct {
	UserId    internal.UserId
	PublicKey string
	AuthKey   string
}

// ---------------------------------------
// Pgp_profile's DB works
// ---------------------------------------
type ProfileModel struct {
	Db *sql.DB
}

func (m ProfileModel) Insert(profile *Profile, id internal.UserId) error {
	query := `
	INSERT INTO pgp_profile (user_id, auth_key, public_key)
	VALUES ($1, $2, $3)`
	args := []any{id, profile.AuthKey, profile.PublicKey}
	_, err := m.Db.Exec(query, args...)
	if err != nil {
		return fmt.Errorf("there was an error while Inserting the User-Pgp-Profile to DB: %v", err)
	}
	return nil
}

func (m ProfileModel) Get(id internal.UserId) (*Profile, error) {
	if id < 1 {
		return nil, internal.ErrRecordNotFound
	}
	query := `SELECT user_id, auth_key, public_key
			FROM pgp_profile
			WHERE user_id = $1`
	var profile Profile
	args := []any{&profile.UserId, &profile.AuthKey, &profile.PublicKey}
	err := m.Db.QueryRow(query, id).Scan(args...)
	if err != nil {
		switch {
		case errors.Is(err, sql.ErrNoRows):
			return nil, internal.ErrRecordNotFound
		default:
			return nil, loggy.Sayr("there was an error while fetching the User Data", err)
		}
	}
	return &profile, nil
}

func (m ProfileModel) Update(profile *Profile) error {
	query := `UPDATE pgp_profile
			SET auth_key = $1, public_key = $2
			WHERE user_id = $3`
	args := []any{profile.AuthKey, profile.PublicKey, profile.UserId}
	_, err := m.Db.Exec(query, args...)
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

func (m ProfileModel) Delete(id internal.UserId) error {
	query := `DELETE FROM pgp_profile
				WHERE user_id = $1`
	res, err := m.Db.Exec(query, id)
	if err != nil {
		return loggy.Sayr("an error while trying to delete the Profile data", err)
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
