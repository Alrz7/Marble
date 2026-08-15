package api

import (
	"marble/app/active"
	"marble/internal/loggy"
	"net/http"
)

func (api *ApiConfig) HealthStatus(w http.ResponseWriter, r *http.Request) {
	stat := envelope{
		"status": "available",
	}
	err := api.writeJSON(w, http.StatusOK, stat, nil)
	if err != nil {
		api.serverErrorResponse(w, r, loggy.Get(err).SetReason(loggy.ErrInternalServer))
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

func (api *ApiConfig) handleWebSocket(w http.ResponseWriter, r *http.Request) {
	active.WebSocket(w, r, api.JwtSecret)
}
