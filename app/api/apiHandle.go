package api

import (
	"errors"
	"marble/app/active"
	"net/http"
)

func (api *ApiConfig) HealthStatus(w http.ResponseWriter, r *http.Request) {
	stat := envelope{
		"status": "available",
	}
	err := api.writeJSON(w, http.StatusOK, stat, nil)
	if err != nil {
		api.serverErrorResponse(w, r, err)
	}
}

func (api *ApiConfig) handleHome(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		api.notFoundResponse(w, r)
		return
	}
	api.HealthStatus(w, r)
	// w.Write([]byte("-Marble-"))
}

func (api *ApiConfig) handleAccount(w http.ResponseWriter, r *http.Request) {
	order := r.Header.Get("task")
	switch order {
	case "create":
		api.createAccount(w, r)
	case "signin":
		api.signIn(w, r)
		// case "delete":
		// not decided yet... (this needs auth works)
	default:
		api.badRequestResponse(w, r, errors.New("request must contain a order header"))
	}
}

func (api *ApiConfig) handleWebSocket(w http.ResponseWriter, r *http.Request) {
	active.WebSocket(w, r, api.JwtSecret)
}
