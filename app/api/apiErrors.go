package api

import (
	"fmt"
	"marble/internal/loggy"
	"net/http"
)

var logger = loggy.DefaultLogger

func (api *apiConfig) logError(r *http.Request, err error) {
	logger.Error(err)
}

func (api *apiConfig) errorResponse(w http.ResponseWriter, r *http.Request, status int, message any) {
	env := envelope{"error": message}
	err := api.writeJSON(w, status, env, nil)
	if err != nil {
		api.logError(r, err)
		w.WriteHeader(500)
	}
}

func (api *apiConfig) serverErrorResponse(w http.ResponseWriter, r *http.Request, err error) {
	api.logError(r, err)
	message := fmt.Sprintf("the server encountered a problem: %v", err)
	api.errorResponse(w, r, http.StatusInternalServerError, message)
}

func (api *apiConfig) notFoundResponse(w http.ResponseWriter, r *http.Request) {
	message := "the requested resource could not be found"
	api.errorResponse(w, r, http.StatusNotFound, message)
}

func (api *apiConfig) methodNotAllowedResponse(w http.ResponseWriter, r *http.Request) {
	message := fmt.Sprintf("the %s method is not supported for this resource", r.Method)
	api.errorResponse(w, r, http.StatusMethodNotAllowed, message)
}

func (api *apiConfig) badRequestResponse(w http.ResponseWriter, r *http.Request, err error) {
	api.errorResponse(w, r, http.StatusBadRequest, err.Error())
}

func (api *apiConfig) failedValidationResponse(w http.ResponseWriter, r *http.Request, errors map[string]string) {
	api.errorResponse(w, r, http.StatusUnprocessableEntity, errors)
}
