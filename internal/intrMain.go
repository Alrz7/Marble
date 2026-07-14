package internal

import (
	"errors"
)

type UserId = int32
type SessionId = int64
type Envelope map[string]any

type Audience struct {
	Name          string `json:"name"`
	UserId        UserId `json:"userId"`
	DisplayId     string `json:"displayId"`
	ProfileAvatar string `json:"profileAvatar"`
	ArmedPubKey   string `json:"armedPubKey"`
}
type ClientSession struct {
	SessionId SessionId `json:"sessionId"`
	Seq       int       `json:"seq"`
	Audience  Audience  `json:"audience"`
}

const (
	// auth err
	ActAuthenticationError = "AuthenticationError"
	ActInvalidTokenError   = "InvalidToken"
	// client err
	ActStatusNotFound            = "NotFound"
	ActStatusMethodNotAllowed    = "MethodNotAllowed"
	ActStatusBadRequest          = "BadRequest"
	ActStatusUnprocessableEntity = "UnprocessableEntity"
	// server err
	ActStatusInternalServerError = "InternalServerError"
	ActUserNotFound              = "UserNotFound"
)

var (
	ErrRecordNotFound = errors.New("Record Not Found")
)
