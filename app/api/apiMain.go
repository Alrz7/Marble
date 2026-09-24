package api

import (
	"context"
	"errors"
	"fmt"
	"marble/app/active"
	"marble/internal/loggy"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

type ApiConfig struct {
	Port      int     `koanf:"port"`
	JwtSecret []byte  `koanf:"jwtSecret"`
	Env       string  `koanf:"env"`
	Limiter   limiter `koanf:"limiter"`
}

type limiter struct {
	Rps     float64       `koanf:"rps"`
	Burst   int           `koanf:"burst"`
	TimeOut time.Duration `koanf:"timeout"`
	Enabled bool          `koanf:"enabled"`
}

func (api *ApiConfig) Serve() {
	srv := &http.Server{
		Addr:         fmt.Sprintf(":%d", api.Port),
		Handler:      api.routes(),
		IdleTimeout:  time.Minute,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
	}
	shutdownError := make(chan *loggy.AppLog)
	go manageSignals(srv, shutdownError)

	loggy.NewAppInfo(fmt.Sprintf("starting server on port %v", api.Port)).Log()
	err := srv.ListenAndServe()
	if err != nil {
		if !errors.Is(err, http.ErrServerClosed) {
			loggy.Get(err).SetMessage("there was an error while shutting down server").Log()
		}
	}
	active.CloseAll()

	shtdError := <-shutdownError
	if shtdError != nil {
		shtdError.Log()
	}

	loggy.NewAppInfo("stopped server").AddParam("addr", srv.Addr).Log()
}

func manageSignals(srv *http.Server, errors chan *loggy.AppLog) {
	quit := make(chan os.Signal, 1)

	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	s := <-quit

	loggy.NewAppInfo("shutting down server").AddParam("signal", s.String()).Log()

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	err := srv.Shutdown(ctx)
	errors <- loggy.Get(err).SetMessage("there was an error while shutting down server")
}
