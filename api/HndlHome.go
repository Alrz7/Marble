package api

// import (
// 	"encoding/json"
// 	"fmt"
// 	"io"
// 	"net/http"
// )

// func (app *Application) HealthStatus(w http.ResponseWriter, r *http.Request) {
// 	fmt.Fprintln(w, "status: available")
// 	fmt.Fprintf(w, "environment: %s\n", app.Api.Env)
// 	fmt.Fprintf(w, "version: %s\n", version)
// }

// func (app *Application) handleHome(w http.ResponseWriter, r *http.Request) {
// 	if r.URL.Path != "/" {
// 		http.NotFound(w, r)
// 		return
// 	}
// 	w.Write([]byte("HomePage"))
// }

// func (app *Application) HandelText(w http.ResponseWriter, r *http.Request) {
// 	w.Header().Set("Access-Control-Allow-Origin", "*")
// 	w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
// 	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
// 	w.Header().Set("Access-Control-Allow-Credentials", "true")

// 	type text struct {
// 		Text string `json:"text"`
// 	}
// 	txt := text{}
// 	rb := r.Body
// 	defer r.Body.Close()
// 	b, err := io.ReadAll(rb)
// 	Logger.Error(err, "")
// 	err = json.Unmarshal(b, &txt)
// 	fmt.Println(txt.Text)
// }

// // type tab struct{}

// // func (h *tab) ServeHTTP(w http.ResponseWriter, r *http.Request) {
// // 	w.Write([]byte("hello there this is tab"))
// // }

// // var Tab1 = &tab{}

// // func snippetCreate(w http.ResponseWriter, r *http.Request) {
// // 	if r.Method != "POST" {
// // 		w.Header().Set("Allow", http.MethodPost) // "POST"
// // 		// w.WriteHeader(405)
// // 		// w.Write([]byte("Only POST Method is Allowed"))
// // 		http.Error(w, "Only POST Method is Allowed", http.StatusMethodNotAllowed) // "405"
// // 		return
// // 	}
// // 	w.Write([]byte("snippet create"))
// // }
