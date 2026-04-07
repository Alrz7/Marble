package config

import (
	fig "github.com/Alrz7/fig/core"
)

var AppMain = fig.CreateNewField("./app/config/files/", "mainConfig")

func ConfInit() {
	AppMain.PanicRestore()
	// AppConfig.Save()
}
