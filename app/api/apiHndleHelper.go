package api

import (
	"net/http"
)

func (api *apiConfig) HealthStatus(w http.ResponseWriter, r *http.Request) {
	stat := envelope{
		"status": "available",
		"systemInfo": map[string]string{"environment": api.Env,
			"version": version},
	}
	err := api.writeJSON(w, http.StatusOK, stat, nil)
	if err != nil {
		api.serverErrorResponse(w, r, err)
	}
}

func (api *apiConfig) handleHome(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		api.notFoundResponse(w, r)
		return
	}
	w.Write([]byte("HomePage"))
}
