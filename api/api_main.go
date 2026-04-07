package api

// import (
// 	"flag"
// 	"fmt"
// 	"marble/echo"
// 	"net/http"
// 	"time"
// )

// const version = "1.0.0"

// var Logger = echo.DefultLogger

// var Api = ApiConf{
// 	Port: 4000,
// 	Env:  "testing",
// }
// var App = Application{
// 	Version: "1.0.0",
// 	Api:     Api,
// }
// var AppConfig = fig.CreateNewHandeler("./internal/files/", "appConfig.json")

// func ConfInit() {
// 	AppConfig.Set("AppConfig", &App)
// 	defer AppConfig.PanicRestore()
// 	// AppConfig.Save()
// }

// func Run() {
// 	ConfInit()
// 	fport := flag.Int("port", Api.Port, "HTTP network address")
// 	flag.Parse()
// 	if *fport > 1023 {
// 		Api.Port = *fport
// 	}
// 	mux := http.NewServeMux()

// 	mux.HandleFunc("/", App.handleHome)
// 	mux.HandleFunc("/text", App.HandelText)
// 	mux.HandleFunc("/saveConf", func(w http.ResponseWriter, r *http.Request) {
// 		AppConfig.Save()
// 		fmt.Fprintln(w, "Config has been saved")
// 	})
// 	mux.HandleFunc("/healthStat", App.HealthStatus)

// 	srv := &http.Server{
// 		Addr:         fmt.Sprintf(":%d", Api.Port),
// 		Handler:      mux,
// 		IdleTimeout:  time.Minute,
// 		ReadTimeout:  10 * time.Second,
// 		WriteTimeout: 30 * time.Second,
// 	}

// 	fmt.Printf("starting server on port %v \n", Api.Port)
// 	err := srv.ListenAndServe()
// 	Logger.Error(err, "Threre was an error while startin the Api server")

// }
