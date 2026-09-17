package config

import "marble/app/api"

type Config struct {
	App *App           `koanf:"app"`
	Api *api.ApiConfig `koanf:"api"`
}

type App struct {
	Version string `koanf:"version"`
	Env     string `koanf:"env"`
}
