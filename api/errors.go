package api

import (
	"fmt"
	"net/http"

	"marble/internal/log"
)

var Logger = log.DefultLogger

func (api *api) logError(r *http.Request, err error) {
	Logger.ErrorLogger.Println(err)
}

func (api *api) errorResponse(w http.ResponseWriter, r *http.Request, status int, message any) {
	env := envelope{"error": message}
	err := api.writeJSON(w, status, env, nil)
	if err != nil {
		api.logError(r, err)
		w.WriteHeader(500)
	}
}

func (api *api) serverErrorResponse(w http.ResponseWriter, r *http.Request, err error) {
	api.logError(r, err)
	message := fmt.Sprintf("the server encountered a problem: %v", err)
	api.errorResponse(w, r, http.StatusInternalServerError, message)
}

func (api *api) notFoundResponse(w http.ResponseWriter, r *http.Request) {
	message := "the requested resource could not be found"
	api.errorResponse(w, r, http.StatusNotFound, message)
}

func (api *api) methodNotAllowedResponse(w http.ResponseWriter, r *http.Request) {
	message := fmt.Sprintf("the %s method is not supported for this resource", r.Method)
	api.errorResponse(w, r, http.StatusMethodNotAllowed, message)
}

func (api *api) badRequestResponse(w http.ResponseWriter, r *http.Request, err error) {
	Api.errorResponse(w, r, http.StatusBadRequest, err.Error())
}

func (api *api) failedValidationResponse(w http.ResponseWriter, r *http.Request, errors map[string]string) {
	api.errorResponse(w, r, http.StatusUnprocessableEntity, errors)
}
