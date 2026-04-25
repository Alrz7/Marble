package internal

import (
	"database/sql"
	"marble/db"
	"marble/internal/log"

	fig "github.com/Alrz7/fig/core"
)

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
	logger := &log.DefultLogger

	Db, err := db.Cfg.Setup()
	logger.Error(err, "there was an error while trying to setup Database")
	logger.Info("database connection pool established")

	App = &Application{
		Version: version,
		Logger:  logger,
		Db: Db,
	}
	return App
}
