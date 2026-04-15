package app

import (
	"marble/app/api"
	"marble/db"
	"marble/internal/log"
	"marble/internal/models"

	fig "github.com/Alrz7/fig/core"
)

var (
	version = "1.0.0"
)

type application struct {
	version string
	logger  *log.Logger
	model   models.Models
	config  *fig.Handeler
}

func Main() {
	logger := &log.DefultLogger

	Db, err := db.Cfg.Setup()
	logger.Error(err, "there was an error while trying to setup Database")
	
	defer Db.Close()
	logger.Info("database connection pool established")
	// app := &application{
	// 	version: version,
	// 	logger:  logger,
	// 	model:   models.NewModels(Db),
	// }
	api.Setup()

}
