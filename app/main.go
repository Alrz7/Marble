package app

import (
	"marble/internal/loggy"
)

func Main() {
	app := Setup()
	defer func() {
		loggy.Sync()
		_ = app.Db.Close()
	}()
	app.api.Run()
}
