package pgp

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"marble/internal"
	"marble/internal/loggy"

	"github.com/lib/pq"
)

type Profile struct {
	Id             internal.UserId
	AuthKey        string
	PubIdentityKey string
	Sessions       map[internal.UserId]int64 `json:"sessions"`
}

// type Message struct{
// 	Body string
// 	Signature []byte
// }

type Session struct {
	Id            int64
	Alpha         internal.UserId
	Beta          internal.UserId
	AlphaMessages [][]byte
	BetaMessages  [][]byte
}

// ---------------------------------------
// Pgp_profile's DB works
// ---------------------------------------
type ProfileModel struct {
	DB *sql.DB
}

func (U *ProfileModel) Insert(profile *Profile, id internal.UserId) error {
	sessionsToBytes, err := json.Marshal(profile.Sessions)
	if err != nil {
		return loggy.Sayr("an error while marshaling Sessions for Inserting data", err)
	}
	query := `
	INSERT INTO pgp_profile (id, auth_key, public_identity_key, sessions)
	VALUES ($1, $2, $3, $4)`
	args := []any{id, profile.AuthKey, profile.PubIdentityKey, sessionsToBytes}
	_, err = U.DB.Exec(query, args...)
	if err != nil {
		return fmt.Errorf("there was an error while Inserting the User-Pgp-Profile to DB: %v", err)
	}
	return nil
}

func (U *ProfileModel) Get(id internal.UserId) (*Profile, error) {
	if id < 1 {
		return nil, internal.ErrRecordNotFound
	}
	query := `SELECT id, auth_key, public_identity_key, sessions
			FROM pgp_profile
			WHERE id = $1`
	var profile Profile
	var sessionsInBytes = []byte{}
	args := []any{&profile.Id, &profile.AuthKey, &profile.PubIdentityKey, &sessionsInBytes}
	err := U.DB.QueryRow(query, id).Scan(args...)
	if err != nil {
		switch {
		case errors.Is(err, sql.ErrNoRows):
			return nil, internal.ErrRecordNotFound
		default:
			return nil, loggy.Sayr("there was an error while fetching the User Data", err)
		}
	}
	profile.Sessions, err = getProfileSessionsFromMarshaled(sessionsInBytes)
	if err != nil {
		return nil, loggy.Sayr("an errror wile Unmashaling the session Bytes", err)
	}
	return &profile, nil
}

func (U *ProfileModel) Update(profile *Profile) error {
	sessionsToBytes, err := json.Marshal(profile.Sessions)
	if err != nil {
		return loggy.Sayr("an error while marshaling Sessions for Updating data", err)
	}
	query := `UPDATE pgp_profile
			SET auth_key = $1, public_identity_key = $2, sessions = $3
			WHERE id = $4`
	args := []any{profile.AuthKey, profile.PubIdentityKey, sessionsToBytes, profile.Id}
	_, err = U.DB.Exec(query, args...)
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

func (U *ProfileModel) Delete(id internal.UserId) error {
	query := `DELETE FROM pgp_profile
				WHERE id = $1`
	res, err := U.DB.Exec(query, id)
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

// ---------------------------------------
// SessionModel's DB works
// ---------------------------------------

type SessionModel struct {
	DB *sql.DB
}

func (U *SessionModel) Insert(session *Session) error {
	query := `
	INSERT INTO pgp_sessions (alpha, beta, alpha_messages, beta_messages)
	VALUES ($1, $2, $3, $4)
	RETURNING 	id`
	args := []any{session.Alpha, session.Beta, pq.Array(session.AlphaMessages), pq.Array(session.BetaMessages)}
	err := U.DB.QueryRow(query, args...).Scan(&session.Id)
	if err != nil {
		return err
	}
	return nil
}

func (U *SessionModel) Get(id int64) (*Session, error) {
	if id < 1 {
		return nil, internal.ErrRecordNotFound
	}
	query := `SELECT id, alpha, beta, alpha_messages, beta_messages
			FROM pgp_sessions
			WHERE id = $1`
	var session Session
	args := []any{&session.Id, &session.Alpha, &session.Beta, pq.Array(&session.AlphaMessages), pq.Array(&session.BetaMessages)}
	err := U.DB.QueryRow(query, id).Scan(args...)
	if err != nil {
		switch {
		case errors.Is(err, sql.ErrNoRows):
			return nil, internal.ErrRecordNotFound
		default:
			return nil, loggy.Sayr("there was an error while fetching the session Data", err)
		}
	}
	return &session, nil

}

func (U *SessionModel) Update(session *Session) error {
	query := `UPDATE pgp_sessions
			SET alpha = $1, beta = $2, alpha_messages = $3, beta_messages = $4
			WHERE id = $5`
	args := []any{session.Alpha, session.Beta, pq.Array(session.AlphaMessages), pq.Array(session.BetaMessages), session.Id}
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

func (U *SessionModel) Delete(id int64) error {
	query := `DELETE FROM pgp_sessions
				WHERE id = $1`
	res, err := U.DB.Exec(query, id)
	if err != nil {
		return loggy.Sayr("an error while trying to delete the session data", err)
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
