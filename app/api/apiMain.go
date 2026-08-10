package api

import (
	"flag"
	"fmt"
	"marble/app/active"
	"marble/internal/loggy"
	"net/http"
	"os"
	"strconv"
	"time"
)

const version = "1.0.0"
const defaultPort = 6280

func Setup() {
	api := apiConfig{}
	api.Version = version
	api.logger = loggy.DefaultLogger

	activeDefaultPort := defaultPort
	if envPort := os.Getenv("PORT"); envPort != "" {
		if parsedPort, err := strconv.Atoi(envPort); err == nil {
			activeDefaultPort = parsedPort
		}
	}

	envJwtSecret := os.Getenv("jwtSecret")
	if envJwtSecret != "" {
		api.JwtSecret = []byte(envJwtSecret)
	} else {
		err := api.setJwtSecret()
		if err != nil {
			api.logger.Errorf("there was an error while setting the Jwt-Secret on Api: %v", err)
		}
	}

	flag.IntVar(&api.Port, "port", activeDefaultPort, "Api server port")
	if api.Port <= 1023 {
		api.logger.Warn(`server Port Should Not be less than-equal 1023 (setting %v as default)`, defaultPort)
		api.Port = activeDefaultPort
	}
	flag.StringVar(&api.Env, "env", "development", "Environment (development|staging|production)")
	flag.Parse()
	// config.ApiConfig.Set("AppConfig", &api)
	// config.ApiConfig.PanicRestore()
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
		Handler:      mux,
		IdleTimeout:  time.Minute,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
	}

	logger.Infof("starting server on port %v", api.Port)
	err := srv.ListenAndServe()
	logger.With("err", err).Error("Threre was an error while starting the Api server")
}

func (api *apiConfig) handleWebSocket(w http.ResponseWriter, r *http.Request) {
	active.WebSocket(w, r, api.JwtSecret)
}
