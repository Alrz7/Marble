package active

import (
	"marble/internal"

	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/websocket"
)

type RequestChannel = string
type RequestStatus = int
type RequestHeaders = map[string]string
type RequestBody = string

const (
	StatusPending RequestStatus = iota
	StatusRequest
	StatusSuccess
	StatusError
	StatusWarning
	StatusCanceled
	StatusTimeout
	StatusRejected
	StatusApproved
	StatusRetry
)

type Audience struct {
	Name          string          `json:"name"`
	UserId        internal.UserId `json:"userId"`
	DisplayId     string          `json:"displayId"`
	ProfileAvatar string          `json:"profileAvatar"`
	ArmedPubKey   string          `json:"armedPubKey"`
}
type Request struct {
	conn    *websocket.Conn
	user    *ActvUser
	Status  RequestStatus  `json:"status"`
	Token   string         `json:"token"`
	Channel RequestChannel `json:"channel"`
	Headers RequestHeaders `json:"headers"`
	Notif   *Notification  `json:"notif"`
	Body    RequestBody    `json:"body"`
}

type Handeler func(*Request)

type Claims struct {
	UserId internal.UserId `json:"userId"`
	jwt.RegisteredClaims
}

// ------------------------------------------

type Notification struct {
	Type    string `json:"type"`
	Key     string `json:"key"`
	Message string `json:"message"`
}
