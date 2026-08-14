package pgp

import (
	"database/sql"
	"errors"
	"marble/internal"
	"marble/internal/loggy"
)

type Profile struct {
	UserId    internal.UserId
	PublicKey string
}

// ---------------------------------------
// Pgp_profile's DB works
// ---------------------------------------
type ProfileModel struct {
	Db *sql.DB
}

func (m ProfileModel) Insert(profile *Profile, id internal.UserId) error {
	query := `
	INSERT INTO pgp_profile (user_id, public_key)
	VALUES ($1, $2)`
	args := []any{id, profile.PublicKey}
	_, err := m.Db.Exec(query, args...)
	if err != nil {
		return loggy.NewAppErr("there was an error while Inserting the User-Pgp-Profile to DB").SetErr(err)
	}
	return nil
}

func (m ProfileModel) Get(id internal.UserId) (*Profile, error) {
	if id < 1 {
		return nil, loggy.NewAppErr(loggy.ErrNoRecord)
	}
	query := `SELECT user_id, public_key
			FROM pgp_profile
			WHERE user_id = $1`
	var profile Profile
	args := []any{&profile.UserId, &profile.PublicKey}
	err := m.Db.QueryRow(query, id).Scan(args...)
	if err != nil {
		switch {
		case errors.Is(err, sql.ErrNoRows):
			return nil, loggy.NewAppErr(loggy.ErrNoRecord)
		default:
			return nil, loggy.NewAppErr(loggy.ErrInternalServer)
		}
	}
	return &profile, nil
}

func (m ProfileModel) Update(profile *Profile) error {
	query := `UPDATE pgp_profile
			SET public_key = $1
			WHERE user_id = $2`
	args := []any{profile.PublicKey, profile.UserId}
	_, err := m.Db.Exec(query, args...)
	if err != nil {
		switch {
		case errors.Is(err, sql.ErrNoRows):
			return loggy.NewAppErr(loggy.ErrNoRecord)
		default:
			return loggy.NewAppErr(loggy.ErrInternalServer).SetMessage("there was an error while Updating User Data").SetErr(err)
		}
	}
	return nil
}

func (m ProfileModel) Delete(id internal.UserId) error {
	query := `DELETE FROM pgp_profile
				WHERE user_id = $1`
	res, err := m.Db.Exec(query, id)
	if err != nil {
		return loggy.NewAppErr(loggy.ErrDbQuery).SetMessage("an error while trying to delete the Profile data").SetErr(err)
	}
	count, err := res.RowsAffected()
	if err != nil {
		return loggy.NewAppErr(loggy.ErrDbQuery).SetMessage("the sql Driver might not support `RowsAffected()`").SetErr(err)
	}
	if count != 1 {
		return loggy.NewAppErr(loggy.ErrNoRecord)

	}
	return nil
}
