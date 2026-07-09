package session

import (
	"marble/internal"
)

func (m SessionModel) CreateSession(alphaId, betaId internal.UserId) (*Session, error) {
	newSession := Session{
		Alpha:   alphaId,
		Beta:    betaId,
		LastSeq: 0,
	}
	err := m.Insert(&newSession)
	if err != nil {
		return nil, err
	}
	return &newSession, nil
}

// func (m MessageModel) SendMessage(message *Message) error {
// 	return m.Insert(message)
// }
