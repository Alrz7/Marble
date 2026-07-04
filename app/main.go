package app

import (
	"database/sql"
	"marble/app/api"
	"marble/db"
	"marble/internal/loggy"

	"charm.land/log/v2"
	fig "github.com/Alrz7/fig/core"
)

var (
	App     *Application
	version = "1.0.0"
)

func Main() {
	app := Setup()
	defer app.Db.Close()
	api.Setup()
}

type Application struct {
	Version string
	Logger  *log.Logger
	Config  *fig.Handler
	Db      *sql.DB
	Models  *db.Models
}

func Setup() *Application {
	logger := loggy.DefaultLogger

	db, models, err := db.InitModels()
	if err != nil {
		logger.With("err", err).Fatal("there was an error while trying to setup Database")
	}
	logger.Info("database connection pool established")

	App = &Application{
		Version: version,
		Logger:  logger,
		Db:      db,
		Models:  models,
	}
	return App
}
