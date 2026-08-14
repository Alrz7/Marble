package loggy

import "errors"

type LogType uint

const (
	TypeError LogType = iota
	TypeWarning
	TypeInfo
)

type AppLog struct {
	Type      LogType           `json:"type"`
	Reason    string            `json:"reason"`
	Message   string            `json:"message"`
	Info      string            `json:"info,omitempty"`
	Err       error             `json:"error,omitempty"`
	Params    map[string]string `json:"params,omitempty"`
	Shareable bool              `json:"shareable"`
}

func (l *AppLog) Error() string {
	if l == nil {
		return ""
	}
	switch {
	case l.Message != "":
		return l.Message

	case l.Err != nil:
		return l.Err.Error()

	case l.Reason != "":
		return l.Reason

	case l.Info != "":
		return l.Info

	default:
		return ""
	}
}

func (l *AppLog) Unwrap() error {
	if l == nil {
		return nil
	}
	return l.Err
}

func (l *AppLog) Is(target error) bool {
	if l == nil {
		return target == nil
	}

	var targetLog *AppLog
	if errors.As(target, &targetLog) {
		if l.Reason != "" && targetLog.Reason != "" {
			return l.Reason == targetLog.Reason
		}
	}

	return false
}

const (
	ErrDbConnection string = "dbConnection"
	ErrDbQuery      string = "dbQuery"
	ErrNoRecord     string = "noRecord"
	ErrDuplicate    string = "duplicateRecord"
	ErrMigration    string = "migrationFailed"

	ErrUnauthorized string = "unauthorized"
	ErrForbidden    string = "forbidden"
	ErrInvalidToken string = "invalidToken"
	ErrExpiredToken string = "expiredToken"

	ErrBadRequest       string = "badRequest"
	ErrValidationFailed string = "validationFailed"
	ErrNotFound         string = "notFound"
	ErrConflict         string = "conflict"
	ErrPayloadTooLarge  string = "payloadTooLarge"

	ErrTimeout     string = "timeout"
	ErrExternalApi string = "externalApiFailed"
	ErrWsHandshake string = "wsHandshakeFailed"
	ErrWsClosed    string = "wsClosed"

	ErrInternalServer string = "internalServer"
	ErrNotImplemented string = "notImplemented"
	ErrFileIO         string = "fileSystemError"
)
