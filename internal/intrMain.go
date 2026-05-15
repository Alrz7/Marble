package internal

import (
	"database/sql"
	"marble/db"
	"marble/internal/loggy"

	"charm.land/log/v2"
	fig "github.com/Alrz7/fig/core"
)
type UserId = int32
type Application struct {
	Version string
	Logger  *log.Logger
	Config  *fig.Handeler
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
