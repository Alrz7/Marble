package session

import (
	"marble/internal"
)

func (m SessionModel) CreateSession(alphaId, betaId internal.UserId, seq int) (*Session, error) {
	newSession := Session{
		Seq:     seq,
		LastSeq: 0,
	}
	/*
	Race-Condition
	if 2 clients like bob and alice were making a session among eachother at the same time thiere can be a Data-race
	and 2 sessions were created, to fix this we make sure to set the lower id as alpha so we wont come up with secondary pares like
	bob -> alice & alice -> bob, then we check the uniqueness by Unique(alpha_id, beta_id) in Db itself
	 */
	if alphaId < betaId{
		newSession.Alpha = alphaId
		newSession.Beta = betaId
	}else{
		newSession.Alpha = betaId
		newSession.Beta = alphaId
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
