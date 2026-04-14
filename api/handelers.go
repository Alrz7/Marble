package api

import (
	"net/http"
)

func (api *api) HealthStatus(w http.ResponseWriter, r *http.Request) {
	stat := envelope{
		"status": "available",
		"systemInfo": map[string]string{"environment": Api.Env,
			"version": version},
	}
	err := api.writeJSON(w, http.StatusOK, stat, nil)
	if err != nil {
		api.serverErrorResponse(w, r, err)
	}
}

func (api *api) handleHome(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		api.notFoundResponse(w, r)
		return
	}
	w.Write([]byte("HomePage"))
}
