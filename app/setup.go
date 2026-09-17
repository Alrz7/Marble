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

	"go.uber.org/zap"
)

type Application struct {
	Conf   *config.App
	Api    *api.ApiConfig
	Logger *zap.Logger
	Db     *sql.DB
	Models *db.Models
}

func Setup() *Application {
	App := &Application{
		Conf: &config.App{},
		Api:  &api.ApiConfig{},
	}
	App.setFlags()

	App.Api.Env = App.Conf.Env
	switch App.Conf.Env {
	case "Development", "Staging":
		App.Logger, _ = zap.NewDevelopment(
			zap.AddCaller(),
			zap.AddCallerSkip(1),
		)
	default:
		App.Logger, _ = zap.NewProduction(
			zap.AddCaller(),
			zap.AddCallerSkip(1),
		)
	}
	loggy.Init(App.Logger)

	db, models, err := db.InitModels()
	App.Db = db
	App.Models = models

	if err != nil {
		loggy.Get(err).SetMessage("there was an error while trying to setup Database").Fatal()
	}
	if db == nil {
		loggy.NewAppErr(loggy.ErrDbConnection).SetMessage("there was an error while trying to setup Database")
	}
	loggy.NewAppInfo("database connection pool established").Log()

	return App
}

func (a *Application) setEnv() *Application {
	envVersion := os.Getenv("version")
	if envVersion != "" {
		a.Conf.Version = envVersion
	}
	envEnvirement := os.Getenv("envirement")
	if envEnvirement != "" {
		a.Conf.Env = envEnvirement
	}

	envJwtSecret := os.Getenv("jwtSecret")
	if envJwtSecret != "" {
		a.Api.JwtSecret = []byte(envJwtSecret)
	} else {
		_ = a.Api.SetJwtSecret()
	}

	if envPort := os.Getenv("PORT"); envPort != "" {
		if parsedPort, err := strconv.Atoi(envPort); err == nil {
			a.Api.Port = parsedPort
		}
	}
	return a
}

func (a *Application) setFlags() *Application {
	flag.Int("port", a.Api.Port, "Api server port")
	flag.StringVar(&a.Conf.Env, "env", "Development", "Envirement (Development|Staging|Production)")
	jwtSec := flag.String("jwtSec", "", "Api's jwt Secret")
	setConfig := flag.String("config", "", "config Dir")
	flag.Parse()

	if *jwtSec != "" {
		a.Api.JwtSecret = []byte(*jwtSec)
	}

	if *setConfig != "" {
		config.Setup(*setConfig, config.Config{Api: a.Api, App: a.Conf})
	} else {
		a.setEnv()
	}
	return a
}
