package session

import (
	"database/sql"
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
		pqError, ok := loggy.ParsePqError(err)
		if ok {
			return loggy.NewAppErr(pqError).SetMessage("error while inserting session-Data").SetErr(err)
		}
		return loggy.EchoWithMessage("unexpected error while Inserting session-Data", err)
	}
	return nil
}

func (m SessionModel) Get(id int64) (*Session, error) {
	if id < 1 {
		return nil, loggy.NewAppErr(loggy.ErrNoRecord)
	}
	query := `SELECT id, seq, alpha_id, beta_id
			FROM session
			WHERE id = $1`
	var session Session
	args := []any{&session.Id, &session.Seq, &session.Alpha, &session.Beta}
	err := m.Db.QueryRow(query, id).Scan(args...)
	if err != nil {
		pqError, ok := loggy.ParsePqError(err)
		if ok {
			return nil, loggy.NewAppErr(pqError).SetMessage("error while fetching session-Data").SetErr(err)
		}
		return nil, loggy.EchoWithMessage("unexpected error while fetching session-Data", err)

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
		pqError, ok := loggy.ParsePqError(err)
		if ok {
			return nil, loggy.NewAppErr(pqError).SetMessage("error while fetching session-Data").SetErr(err)
		}
		return nil, loggy.EchoWithMessage("unexpected error while fetching session-Data", err)
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
		pqError, ok := loggy.ParsePqError(err)
		if ok {
			return loggy.NewAppErr(pqError).SetMessage("error while Updating session-Data").SetErr(err)
		}
		return loggy.EchoWithMessage("unexpected error while Updating session-Data", err)

	}
	return nil
}

func (m SessionModel) Delete(id int64) error {
	query := `DELETE FROM session
				WHERE id = $1`
	res, err := m.Db.Exec(query, id)
	if err != nil {
		pqError, ok := loggy.ParsePqError(err)
		if ok {
			return loggy.NewAppErr(pqError).SetMessage("error while deleting session-Data").SetErr(err)
		}
		return loggy.EchoWithMessage("unexpected error while deleting session-data", err)
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
