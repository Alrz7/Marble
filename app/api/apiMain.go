package api

import (
	"flag"
	"fmt"
	"marble/config"
	"marble/internal/log"
	"net/http"
	"time"
)

const version = "1.0.0"

func Setup() {
	api := apiConfig{}
	api.Version = version
	api.logger = &log.DefultLogger
	flag.IntVar(&api.Port, "port", 6280, "Api server port")
	if api.Port <= 1023 {
		api.logger.NewError("server Port Should Not be less than-equal 1023")
	}
	flag.StringVar(&api.Env, "env", "development", "Environment (development|staging|production)")
	flag.Parse()
	config.ApiConfig.Set("AppConfig", &api)
	config.ApiConfig.PanicRestore()
	api.Run()
}

func (api *apiConfig) Run() {
	
	mux := http.NewServeMux()

	// at this time { NO INTERNET == NO HTTpROUTER} :)

	// Convert the notFoundResponse() helper to a http.Handler using the
	// http.HandlerFunc() adapter, and then set it as the custom error handler for 404
	// Not Found responses.

	// router.NotFound = http.HandlerFunc(app.notFoundResponse)
	// Likewise, convert the methodNotAllowedResponse() helper to a http.Handler and set
	// it as the custom error handler for 405 Method Not Allowed responses.

	// router.MethodNotAllowed = http.HandlerFunc(app.methodNotAllowedResponse)

	mux.HandleFunc("/", api.handleHome)
	mux.HandleFunc("/account/", api.hndlAccount)

	srv := &http.Server{
		Addr:         fmt.Sprintf(":%d", api.Port),
		Handler:      enableCORS(mux),
		IdleTimeout:  time.Minute,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
	}

	Logger.Infot("starting server on port %v", api.Port)
	err := srv.ListenAndServe()
	Logger.Error(err, "Threre was an error while starting the Api server")
}

func enableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, order, taskType, configType")
		w.Header().Set("Access-Control-Allow-Credentials", "true")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}
