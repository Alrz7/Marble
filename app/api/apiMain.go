package api

import (
	"flag"
	"fmt"
	"marble/app/active"
	"marble/config"
	"marble/internal/loggy"
	"net/http"
	"time"
)

const version = "1.0.0"
const defaultPort = 6280

func Setup() {
	api := apiConfig{}
	api.Version = version
	api.logger = loggy.DefaultLogger
	err := api.setJwtSecret()
	if err != nil {
		api.logger.Errorf("there was an error while setting the Jwt-Secret on Api: %v", err)
	}
	flag.IntVar(&api.Port, "port", defaultPort, "Api server port")
	if api.Port <= 1023 {
		api.logger.Warn(`server Port Should Not be less than-equal 1023 (setting %v as default)`, defaultPort)
		api.Port = defaultPort
	}
	flag.StringVar(&api.Env, "env", "development", "Environment (development|staging|production)")
	flag.Parse()
	config.ApiConfig.Set("AppConfig", &api)
	config.ApiConfig.PanicRestore()
	api.Run()
}

func (api *apiConfig) Run() {

	mux := http.NewServeMux()

	mux.HandleFunc("/", api.handleHome)
	mux.HandleFunc("/account/", api.handleAccount)
	mux.HandleFunc("/actv", api.handleWebSocket)
	mux.HandleFunc("/auth/refresh", api.getNewTokens)

	srv := &http.Server{
		Addr:         fmt.Sprintf(":%d", api.Port),
		Handler:      enableCORS(mux),
		IdleTimeout:  time.Minute,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
	}

	logger.Infof("starting server on port %v", api.Port)
	err := srv.ListenAndServe()
	logger.With("err", err).Error("Threre was an error while starting the Api server")
}

func enableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin == "http://localhost:1420" || origin == "http://localhost:5173" {
			w.Header().Set("Access-Control-Allow-Origin", origin)
		} else {
			w.Header().Set("Access-Control-Allow-Origin", "http://localhost:1420")
		}
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, task, order, taskType, configType")
		w.Header().Set("Access-Control-Allow-Credentials", "true")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (api *apiConfig) handleWebSocket(w http.ResponseWriter, r *http.Request) {
	active.WebSocket(w, r, api.jwtSecret)
}
