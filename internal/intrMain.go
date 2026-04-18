package internal

import (
	"marble/db"
	"marble/internal/log"
	"marble/internal/models"

	fig "github.com/Alrz7/fig/core"
)

type Application struct {
	Version string
	Logger  *log.Logger
	Models  models.Models
	Config  *fig.Handeler
}

var (
	App     *Application
	version = "1.0.0"
)

func Setup() *Application {
	logger := &log.DefultLogger

	Db, err := db.Cfg.Setup()
	logger.Error(err, "there was an error while trying to setup Database")

	defer Db.Close()
	logger.Info("database connection pool established")
	App = &Application{
		Version: version,
		Logger:  logger,
		Models:  models.NewModels(Db),
	}
	return App
}
