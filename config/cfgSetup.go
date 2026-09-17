package config

import (
	"marble/internal/loggy"
	"os"

	"github.com/knadh/koanf/parsers/yaml"
	"github.com/knadh/koanf/providers/file"
	"github.com/knadh/koanf/v2"
)

var K = koanf.New(".")

func Setup(configPath string, AppConfig Config) {
	// configPath := filepath.Join(configDir, "marble.yaml")

	if _, err := os.Stat(configPath); os.IsNotExist(err) {
		loggy.Get(err).Fatal()
	}

	err := K.Load(
		file.Provider(configPath),
		yaml.Parser(),
	)
	if err != nil {
		loggy.Get(err).Fatal()
	}

	err = K.Unmarshal("", &AppConfig)
	if err != nil {
		loggy.Get(err).Fatal()
	}

}
