package app

import (
	"marble/app/api"
	"marble/internal"
)

func Main() {
	app := internal.Setup()
	api.Setup(app)

}
