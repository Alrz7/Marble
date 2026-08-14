package api

import (
	"fmt"
	"marble/internal/loggy"
	"net/http"
	"time"
)

type ApiConfig struct {
	Port      int    `json:"port"`
	JwtSecret []byte `json:"jwtSecret"`
}

func (api *ApiConfig) Run() {
	srv := &http.Server{
		Addr:         fmt.Sprintf(":%d", api.Port),
		Handler:      api.routes(),
		IdleTimeout:  time.Minute,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
	}

	loggy.NewAppInfo(fmt.Sprintf("starting server on port %v", api.Port))
	err := srv.ListenAndServe()
	loggy.NewAppErr("Threre was an error while starting the Api server").AddParam("err", err.Error())
}
