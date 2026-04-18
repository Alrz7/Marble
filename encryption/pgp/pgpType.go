package pgp

import (
	"database/sql"

	"github.com/lib/pq"
)

type PgpProfile struct {
	AuthKey        string
	PubIdentityKey string
	Sesions        map[ProfileAdress]uint64
	Adress         ProfileAdress
}

type ProfileAdress string

// type Message struct{
// 	Body string
// 	Signature []byte
// }

type Session struct {
	Id            uint64
	Alpha         ProfileAdress
	Beta          ProfileAdress
	AlphaMessages [][]byte
	BetaMessages  [][]byte
}

type SessionModel struct {
	DB *sql.DB
}

func (U *SessionModel) Insert(session *Session) error {
	query := `
	INSERT INTO pgp_sessions (alpha, beta)
	VALUES ($1, $2)
	RETURNING 	id`
	args := []any{session.Alpha, session.Beta}
	err := U.DB.QueryRow(query, args...).Scan(&session.Id)
	if err != nil {
		return err
	}
	query = `
	INSERT INTO user_messages (session_id, message)
	VALUES ($1, $2)
	RETURNING 	id`
	args = []any{session.Id, pq.Array(session.AlphaMessages)}
	var MessageID int
	err = U.DB.QueryRow(query, args...).Scan(&MessageID)
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
