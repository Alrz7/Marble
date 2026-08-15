package pgp

import (
	"database/sql"
	"marble/internal"
	"marble/internal/loggy"
)

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
		pqError, ok := loggy.ParsePqError(err)
		if ok {
			return loggy.NewAppErr(pqError).SetMessage("error while inserting UserPgp-Profile").SetErr(err)
		}
		return loggy.EchoWithMessage("error while inserting UserPgp-Profile", err)
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
		pqError, ok := loggy.ParsePqError(err)
		if ok {
			return nil, loggy.NewAppErr(pqError).SetMessage("error while fetching UserPgp-Profile").SetErr(err)
		}
		return nil, loggy.EchoWithMessage("error while fetching UserPgp-Profile", err)
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
		pqError, ok := loggy.ParsePqError(err)
		if ok {
			return loggy.NewAppErr(pqError).SetMessage("error while updating UserPgp-Profile").SetErr(err)
		}
		return loggy.EchoWithMessage("error while updating UserPgp-Profile", err)
	}
	return nil
}

func (m ProfileModel) Delete(id internal.UserId) error {
	query := `DELETE FROM pgp_profile
				WHERE user_id = $1`
	res, err := m.Db.Exec(query, id)
	if err != nil {
		pqError, ok := loggy.ParsePqError(err)
		if ok {
			return loggy.NewAppErr(pqError).SetMessage("error while deleting UserPgp-Profile").SetErr(err)
		}
		return loggy.EchoWithMessage("error while deleting UserPgp-Profile", err)
	}
	count, err := res.RowsAffected()
	if err != nil {
		return loggy.EchoWithMessage("error while deleting UserPgp-Profile", err)
	}
	if count != 1 {
		return loggy.NewAppErr(loggy.ErrNoRecord).SetMessage("error while deleting UserPgp-Profile")
	}
	return nil
}
