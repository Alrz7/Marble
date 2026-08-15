package api

import (
	"net/http"

	"github.com/julienschmidt/httprouter"
)

func (api *ApiConfig) routes() *httprouter.Router {

	router := httprouter.New()

	router.HandlerFunc(http.MethodGet, "/", api.handleHome)
	router.HandlerFunc(http.MethodPost, "/auth/signup", api.handleSignUp)
	router.HandlerFunc(http.MethodPost, "/auth/login", api.handleSignIn)
	router.HandlerFunc(http.MethodPost, "/auth/refresh", api.HandleGetTokens)
	router.HandlerFunc(http.MethodDelete, "/account/delete", api.handleDeleteAccount)
	router.HandlerFunc(http.MethodGet, "/actv", api.handleWebSocket)

	return router
}
