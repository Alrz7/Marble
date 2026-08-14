package api

import (
	"net/http"

	"github.com/julienschmidt/httprouter"
)

func (api *ApiConfig) routes() *httprouter.Router {

	router := httprouter.New()

	router.HandlerFunc(http.MethodGet, "/", api.handleHome)
	router.HandlerFunc(http.MethodPost, "/account/", api.handleAccount)
	router.HandlerFunc(http.MethodPost, "/actv", api.handleWebSocket)
	router.HandlerFunc(http.MethodPost, "/auth/refresh", api.getNewTokens)

	return router
}
