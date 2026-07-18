package session

import (
	"database/sql"
	"errors"
	"marble/internal"
	"marble/internal/loggy"
)

type SessionModel struct {
	Db *sql.DB
}

func (m SessionModel) Insert(session *Session) error {
	query := `
	INSERT INTO session (seq, alpha_id, beta_id)
	VALUES ($1, $2, $3)
	RETURNING 	id`
	args := []any{session.Seq, session.Alpha, session.Beta}
	err := m.Db.QueryRow(query, args...).Scan(&session.Id)
	if err != nil {
		return err
	}
	return nil
}

func (m SessionModel) Get(id int64) (*Session, error) {
	if id < 1 {
		return nil, internal.ErrRecordNotFound
	}
	query := `SELECT id, seq, alpha_id, beta_id
			FROM session
			WHERE id = $1`
	var session Session
	args := []any{&session.Id, &session.Seq, &session.Alpha, &session.Beta}
	err := m.Db.QueryRow(query, id).Scan(args...)
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

func (m SessionModel) GetSessionsByEvent(userId internal.UserId, lastEventSeq int, limit int) ([]*internal.ClientSession, error) {
	query := `--sql
	SELECT id, seq, alpha_id
	FROM session
	WHERE beta_id = $1 AND seq > $2 ORDER BY seq ASC LIMIT $3`

	var sessions []*internal.ClientSession
	rows, err := m.Db.Query(query, userId, lastEventSeq, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var session internal.ClientSession
		err = rows.Scan(&session.SessionId, &session.Seq, &session.Audience.UserId)
		if err != nil {
			return nil, err
		}
		sessions = append(sessions, &session)
	}
	err = rows.Err()
	if err != nil {
		return nil, loggy.Sayr("there was an error while fetching the session Data", err)
	}
	return sessions, nil
}

func (m SessionModel) Update(session *Session) error {
	query := `UPDATE session
			SET alpha_id = $1, beta_id = $2
			WHERE id = $3`
	args := []any{session.Alpha, session.Beta, session.Id}
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

// func (m SessionModel) IncreaseMessageLastSeq(sessionId internal.SessionId) (int, error) {
// 	var res int
// 	query := `UPDATE session
// SET
//   message_last_seq = message_last_seq + 1
// WHERE
//   id = $1
// RETURNING
//   message_last_seq;`
// 	err := m.Db.QueryRow(query, sessionId).Scan(&res)
// 	if err != nil {
// 		return -1, err
// 	}
// 	return res, nil
// }

func (m SessionModel) Delete(id int64) error {
	query := `DELETE FROM session
				WHERE id = $1`
	res, err := m.Db.Exec(query, id)
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
