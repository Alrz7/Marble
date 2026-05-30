package config

import (
	fig "github.com/Alrz7/fig/core"
)

var AppConfig = fig.CreateNewHandler("./config/files/", "mainConfig")
var ApiConfig = fig.CreateNewField("./config/files/", "apiConfig")

func ConfInit() {
	AppConfig.PanicRestore()
	// AppConfig.Save()
}
