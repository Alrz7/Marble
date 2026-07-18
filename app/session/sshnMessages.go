package session

import (
	"database/sql"
	"marble/internal"
)

type MessageModel struct {
	Db *sql.DB
}

func (m *MessageModel) Insert(message *Message) error {
	query := `--sql
	WITH updated_session AS (
		UPDATE session
		SET message_last_seq = message_last_seq + 1
		WHERE id = $1
		RETURNING message_last_seq
	)
	INSERT INTO message (seq, session_id, sender_id, content, profile)
	VALUES ((SELECT message_last_seq FROM updated_session), $1, $2, $3, $4)
	RETURNING id, seq;`

	args := []any{message.SessionId, message.SenderId, message.Content, message.Profile}
	err := m.Db.QueryRow(query, args...).Scan(&message.Id, &message.Seq)
	if err != nil {
		return err
	}
	return nil
}

func (m *MessageModel) GetMessagesByEvent(sessionId internal.SessionId, senderId internal.UserId, limit int) ([]*Message, error) {
	query := `--sql
	SELECT seq, session_id, sender_id, content, profile FROM message
	WHERE session_id = $1 AND sender_id = $2 ORDER BY seq ASC LIMIT $3`
	rows, err := m.Db.Query(query, sessionId, senderId, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var res []*Message
	for rows.Next() {
		var nxm Message

		err = rows.Scan(&nxm.Seq, &nxm.SessionId, &nxm.SenderId, &nxm.Content, &nxm.Profile)
		if err != nil {
			return nil, err
		}
		res = append(res, &nxm)
	}
	err = rows.Err()
	if err != nil {
		return nil, err
	}
	return res, nil
}

func (m *MessageModel) DeleteMessagesByEvent(SessionId internal.SessionId, senderId internal.UserId, lastMessageSeq int) error {
	query := `DELETE FROM message WHERE session_id = $1 AND sender_id = $2 AND seq <= $3`
	_, err := m.Db.Exec(query, SessionId, senderId, lastMessageSeq)
	if err != nil {
		return err
	}
	return nil
}
