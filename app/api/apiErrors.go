package api

import (
	"marble/internal/loggy"
	"net/http"
)

var logger = loggy.DefaultZapLogger

func (api *ApiConfig) errorResponse(w http.ResponseWriter, r *http.Request, status int, AppErr *loggy.AppLog) {
	env := envelope{
		"error": envelope{
			"reason":  AppErr.Reason,
			"message": AppErr.Message,
		},
	}
	err := api.writeJSON(w, status, env, nil)
	if err != nil {
		w.WriteHeader(500)
	}
}

func (api *ApiConfig) serverErrorResponse(w http.ResponseWriter, r *http.Request, AppErr *loggy.AppLog) {
	appError := loggy.Get(AppErr)
	appError.Log()
	api.errorResponse(w, r, http.StatusInternalServerError, AppErr)
}

func (api *ApiConfig) notFoundResponse(w http.ResponseWriter, r *http.Request) {
	err := loggy.NewAppErr(loggy.ErrNoRecord).SetMessage("the requested resource could not be found")
	api.errorResponse(w, r, http.StatusNotFound, err)
}

func (api *ApiConfig) methodNotAllowedResponse(w http.ResponseWriter, r *http.Request) {
	err := loggy.NewAppErr(loggy.ErrBadRequest).SetMessage("method does Not support this resource").AddParam("method", r.Method)
	api.errorResponse(w, r, http.StatusMethodNotAllowed, err)
}

func (api *ApiConfig) badRequestResponse(w http.ResponseWriter, r *http.Request, AppErr *loggy.AppLog) {
	api.errorResponse(w, r, http.StatusBadRequest, AppErr)
}
