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
	Id        int
	Seq       int
	SessionId internal.SessionId
	SenderId  internal.UserId
	Content   string
	Profile   string
	CreatedAt time.Time
}
