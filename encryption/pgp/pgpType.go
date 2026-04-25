package pgp

import (
	"database/sql"
	"encoding/json"

	"github.com/lib/pq"
)

type Profile struct {
	AuthKey        string
	PubIdentityKey string
	Sessions       map[Profileaddress]uint64 `json:"sessions"`
	Address        Profileaddress
}

type Profileaddress string

// type Message struct{
// 	Body string
// 	Signature []byte
// }

type Session struct {
	Id            uint64
	Alpha         Profileaddress
	Beta          Profileaddress
	AlphaMessages [][]byte
	BetaMessages  [][]byte
}

type ProfileModel struct {
	DB *sql.DB
}

func (U *ProfileModel) Insert(profile *Profile, id uint32) error {
	sessionsToBytes, err := json.Marshal(profile.Sessions)
	if err != nil {
		return err
	}
	query := `
	INSERT INTO pgp_profile (id, auth_key, public_identity_key, sessions)
	VALUES ($1, $2, $3, $4)`
	args := []any{id, profile.AuthKey, profile.PubIdentityKey, sessionsToBytes}
	U.DB.QueryRow(query, args...)
	// if err != nil {
	// 	return fmt.Errorf("there was an error while Inserting the User-Pgp-Profile to DB: %v", err)

	// }
	return nil
}

func (U *ProfileModel) Get(id uint64) (*Profile, error) {
	return nil, nil
}

func (U *ProfileModel) Update(user *Profile) error {
	return nil
}

func (U *ProfileModel) Delete(id uint64) error {
	return nil
}

// -------
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

func (U *SessionModel) Get(id uint64) (*Session, error) {
	return nil, nil
}

func (U *SessionModel) Update(user *Session) error {
	return nil
}

func (U *SessionModel) Delete(id uint64) error {
	return nil
}
