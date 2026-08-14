package config

import (
	"marble/internal/loggy"

	fig "github.com/Alrz7/fig/core"
)

var AppConfig, appErr = fig.CreateNewHandler("./config/files/", "mainConfig")
var ApiConfig, apiErr = fig.CreateNewField("./config/files/", "apiConfig")

func ConfInit() {
	if appErr != nil {
		loggy.NewAppErr(appErr.Error()).Panic()
	}
	if apiErr != nil {
		loggy.NewAppErr(apiErr.Error()).Panic()
	}
	AppConfig.PanicRestore()
	// AppConfig.Save()
}
