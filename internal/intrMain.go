package internal

import (
	"errors"
)

type UserId = int32
type SessionId = int64
type Envelope map[string]any

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
