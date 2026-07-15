package session

import (
	"marble/internal"
	"time"
)

type Session struct {
	Id      int64
	Seq     int
	Alpha   internal.UserId
	Beta    internal.UserId
	LastSeq int
}

type Message struct {
	Id        int                `json:"id"`
	Seq       int                `json:"seq"`
	SessionId internal.SessionId `json:"sessionId"`
	SenderId  internal.UserId    `json:"senderId"`
	Content   string             `json:"content"`
	Profile   string             `json:"profile"`
	CreatedAt time.Time          `json:"createdAt"`
	Status    string             `json:"status"`
}
