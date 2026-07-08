package session

import (
	"fmt"
	"marble/internal"
)

func (m SessionModel) CreateSession(alphaId, betaId internal.UserId) (*Session, error) {
	newSession := Session{
		Alpha:   alphaId,
		Beta:    betaId,
		LastSeq: 0,
	}
	err := m.Save(&newSession)
	if err != nil {
		return nil, err
	}
	return &newSession, nil
}

func (m MessageModel) SendMessage(message *Message) error {
	return m.Insert(message)
}

func (m SessionModel) Save(session *Session) error {
	err := m.Insert(session)
	if err != nil {
		fmt.Println(err)
		return err
	}
	return nil
}
