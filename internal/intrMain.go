package internal

import (
	"database/sql"
	"errors"
	"marble/db"
	"marble/internal/loggy"

	"charm.land/log/v2"
	fig "github.com/Alrz7/fig/core"
)

type UserId = int32
type SessionId = int64
type Envelope map[string]any

type Audience struct {
	Name        string `json:"name"`
	UserId      UserId `json:"userId"`
	DisplayId   string `json:"displayId"`
	ArmedPubKey string `json:"armedPubKey"`
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

type Application struct {
	Version string
	Logger  *log.Logger
	Config  *fig.Handler
	Db      *sql.DB
}

var (
	App     *Application
	version = "1.0.0"
)

func Setup() *Application {
	logger := loggy.DefaultLogger

	Db, err := db.Cfg.Setup()
	if err != nil {
		logger.With("err", err).Fatal("there was an error while trying to setup Database")
	}
	logger.Info("database connection pool established")

	App = &Application{
		Version: version,
		Logger:  logger,
		Db:      Db,
	}
	return App
}
