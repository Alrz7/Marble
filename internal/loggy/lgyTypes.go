package loggy

import (
	"database/sql"
	"errors"

	"github.com/lib/pq"
)

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

	if targetLog, ok := errors.AsType[*AppLog](target); ok {
		if l.Reason != "" && targetLog.Reason != "" {
			return l.Reason == targetLog.Reason
		}
	}

	return false
}

func ParsePqError(err error) (string, bool) {
	pqErr, ok := errors.AsType[*pq.Error](err)
	if !ok {
		return "", false
	}

	switch pqErr.Code {
	case "23505":
		return ErrDuplicateRecord, true
	case "23503":
		return ErrForeignKeyViolation, true
	case "23502":
		return ErrNotNullViolation, true
	case "23514":
		return ErrCheckViolation, true
	case "22001":
		return ErrValueTooLong, true
	case "40001":
		return ErrTransactionConflict, true
	case "40P01":
		return ErrDeadlockDetected, true
	case "57014":
		return ErrQueryTimeout, true
	case "08001", "08006":
		return ErrDatabaseUnavailable, true
	}
	if errors.Is(err, sql.ErrNoRows) {
		return ErrNoRecord, true
	}
	return "", false
}

const (
	ErrDbConnection        string = "dbConnection"
	ErrDbQuery             string = "dbQuery"
	ErrNoRecord            string = "noRecord"
	ErrDuplicate           string = "duplicateRecord"
	ErrMigration           string = "migrationFailed"
	ErrDuplicateRecord     string = "DUPLICATE_RECORD"
	ErrForeignKeyViolation string = "FOREIGN_KEY_VIOLATION"
	ErrNotNullViolation    string = "NOT_NULL_VIOLATION"
	ErrCheckViolation      string = "CHECK_VIOLATION"
	ErrValueTooLong        string = "VALUE_TOO_LONG"
	ErrTransactionConflict string = "TRANSACTION_CONFLICT"
	ErrDeadlockDetected    string = "DEADLOCK_DETECTED"
	ErrQueryTimeout        string = "QUERY_TIMEOUT"
	ErrDatabaseUnavailable string = "DATABASE_UNAVAILABLE"

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

	ErrUnexpected string = "unexpectedError"
)
