package app

import (
	"database/sql"
	"flag"
	"marble/app/api"
	"marble/config"
	"marble/db"
	"marble/internal/loggy"
	"os"
	"strconv"

	fig "github.com/Alrz7/fig/core"
	"go.uber.org/zap"
)

type Application struct {
	Version     string
	Environment string
	Logger      *zap.Logger
	Config      *fig.Handler
	Db          *sql.DB
	Models      *db.Models
	api         *api.ApiConfig
}

var (
	version = "v0.1.2"
)

func Setup() *Application {
	App := &Application{
		Version:     version,
		Environment: "Development",
		Config:      config.AppConfig,
		api: &api.ApiConfig{
			Port: 6280,
		},
	}
	App.setEnv()
	App.setFlags()

	switch App.Environment {
	case "Development", "Staging":
		App.Logger, _ = zap.NewDevelopment()
	default:
		App.Logger, _ = zap.NewProduction()
	}
	loggy.Init(App.Logger)

	db, models, err := db.InitModels()
	App.Db = db
	App.Models = models

	if err != nil {
		loggy.NewAppErr(loggy.ErrDbConnection).SetMessage("there was an error while trying to setup Database")
	}
	loggy.NewAppInfo("database connection pool established").Log()

	return App
}

func (a *Application) setEnv() *Application {
	envVersion := os.Getenv("Version")
	if envVersion != "" {
		a.Version = envVersion
	}
	envEnvirement := os.Getenv("Envirement")
	if envVersion != "" {
		a.Version = envEnvirement
	}

	if envPort := os.Getenv("PORT"); envPort != "" {
		if parsedPort, err := strconv.Atoi(envPort); err == nil {
			a.api.Port = parsedPort
		}
	}
	return a
}

func (a *Application) setFlags() *Application {
	flag.Int("port", a.api.Port, "Api server port")
	flag.StringVar(&a.Environment, "env", "Development", "Environment (Development|Staging|Production)")
	// flagEnableConfig := flag.Bool("enableConfig", true, "manual conFIG state management")
	flag.Parse()

	// if *flagEnableConfig {
	// 	config.ApiConfig.Set("AppConfig", a)
	// 	config.ApiConfig.PanicRestore()
	// }
	return a
}
