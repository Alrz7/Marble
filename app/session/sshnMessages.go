package session

import (
	"database/sql"
	"marble/internal"
	"marble/internal/loggy"
)

type MessageModel struct {
	Db *sql.DB
}

func (m *MessageModel) Insert(message *Message) error {
	loggy.DefaultLogger.Info(message)

	query := `--sql
	INSERT INTO message (seq, session_id, sender_id, content, profile)
	VALUES ($1, $2, $3, $4, $5)
	RETURNING 	id`
	args := []any{message.Seq, message.SessionId, message.SenderId, message.Content, message.Profile}
	err := m.Db.QueryRow(query, args...).Scan(&message.Id)
	if err != nil {
		return err
	}
	return nil
}

func (m *MessageModel) GetBySesionId(sessionId internal.SessionId) ([]*Message, error) {
	query := `--sql
	SELECT seq, session_id, sender_id, content, profile FROM message
	WHERE session_id = $1`
	rows, err := m.Db.Query(query, sessionId)
	if err != nil {
		return nil, err
	}
	var res []*Message
	for rows.Next() {
		var nxm Message

		err = rows.Scan(&nxm.Seq, &nxm.SessionId, &nxm.SenderId, &nxm.Content, &nxm.Profile)
		if err != nil {
			return nil, err
		}
		res = append(res, &nxm)
	}
	return res, nil
}
