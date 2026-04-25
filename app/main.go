package app

import (
	"marble/app/api"
	"marble/internal"
)

func Main() {
	app := internal.Setup()
	defer app.Db.Close()
	api.Setup(app)
}