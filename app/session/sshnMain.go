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

// func (m SessionModel) ReadMessage(alpha, beta *pgp.Profile, session *Session, from, count int) ([]*Message, int, error) {
// 	var Messages []*Message
// 	if alpha.UserId == session.Alpha && beta.UserId == session.Beta {
// 		Messages = &session.BetaMessages
// 	} else if alpha.UserId == session.Beta && beta.UserId == session.Alpha {
// 		Messages = &session.AlphaMessages
// 	} else {
// 		return nil, -1, errors.New("There was a mismatch among audience while sending message")
// 	}
// 	res := []string{}

// 	if from == -1 {
// 		from = len(*Messages) - 1
// 	}
// 	var lastIndex int
// 	for i := from; i > 0 && (count > 0 || count == -1); i-- {
// 		armMessage := (*Messages)[i]
// 		decMessage := armMessage
// 		res = append(res, string(decMessage))
// 		if count != -1 {
// 			count--
// 		}
// 		lastIndex = i
// 	}
// 	return &res, lastIndex, nil
// }

func (m SessionModel) Save(session *Session) error {
	err := m.Insert(session)
	if err != nil {
		fmt.Println(err)
		return err
	}
	return nil
}
