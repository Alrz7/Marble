package api

import (
	"flag"
	"fmt"
	"net/http"
	"time"

	fig "github.com/Alrz7/fig/core"
)

const version = "1.0.0"

var Api = api{
	Version: "1.0.0",
	Port:    6280,
	Env:     "testing",
}

var ApiConfig = fig.CreateNewField("./app/config/files/", "apiConfig")

func ConfInit() {
	ApiConfig.Set("AppConfig", &Api)
	ApiConfig.PanicRestore()
}

func Run() {
	ConfInit()
	fport := flag.Int("port", Api.Port, "HTTP network address")
	flag.Parse()
	if *fport > 1023 {
		Api.Port = *fport
	}
	mux := http.NewServeMux()

	// at this time { NO INTERNET == NO HTTpROUTER} :)

	// Convert the notFoundResponse() helper to a http.Handler using the
	// http.HandlerFunc() adapter, and then set it as the custom error handler for 404
	// Not Found responses.

	// router.NotFound = http.HandlerFunc(app.notFoundResponse)
	// Likewise, convert the methodNotAllowedResponse() helper to a http.Handler and set
	// it as the custom error handler for 405 Method Not Allowed responses.

	// router.MethodNotAllowed = http.HandlerFunc(app.methodNotAllowedResponse)

	mux.HandleFunc("/", Api.handleHome)
	mux.HandleFunc("/account/", Api.hndlAccount)

	srv := &http.Server{
		Addr:         fmt.Sprintf(":%d", Api.Port),
		Handler:      enableCORS(mux),
		IdleTimeout:  time.Minute,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
	}

	Logger.Infot("starting server on port %v", Api.Port)
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
