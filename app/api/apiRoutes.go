package api

import (
	"marble/app/active"
	"marble/internal/loggy"
	"net/http"

	"github.com/julienschmidt/httprouter"
)

func (api *ApiConfig) routes() http.Handler {

	router := httprouter.New()

	router.HandlerFunc(http.MethodGet, "/", api.handleHome)
	router.HandlerFunc(http.MethodPost, "/auth/signup", api.handleSignUp)
	router.HandlerFunc(http.MethodPost, "/auth/login", api.handleSignIn)
	router.HandlerFunc(http.MethodPost, "/auth/refresh", api.HandleGetTokens)
	router.HandlerFunc(http.MethodPatch, "/account/update", api.handleUserUpdate)
	router.HandlerFunc(http.MethodDelete, "/account/delete", api.handleDeleteAccount)
	router.HandlerFunc(http.MethodGet, "/actv", api.handleWebSocket) // story Begins here... :)

	return api.rateLimit(router)
}

func (api *ApiConfig) handleHome(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		api.notFoundResponse(w, r)
		return
	}
	api.HealthStatus(w, r)
	// w.Write([]byte("-Marble-"))
}

func (api *ApiConfig) HealthStatus(w http.ResponseWriter, r *http.Request) {
	stat := envelope{
		"status": "available",
	}
	err := api.writeJSON(w, http.StatusOK, stat, nil)
	if err != nil {
		api.serverErrorResponse(w, r, loggy.Get(err).SetReason(loggy.ErrInternalServer))
	}
}

func (api *ApiConfig) handleWebSocket(w http.ResponseWriter, r *http.Request) {
	active.WebSocket(w, r, api.JwtSecret)
}
