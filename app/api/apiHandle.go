package api

import (
	"marble/app/user"
	"net/http"
)

// Accounts----------------------

func (api *apiConfig) hndlAccount(w http.ResponseWriter, r *http.Request) {
	order := r.Header.Get("task")
	switch order {
	case "create":
		api.createAccount(w, r)
	}
}

func (api *apiConfig) createAccount(w http.ResponseWriter, r *http.Request) {
	var props struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Password string `json:"passsword"`
	}
	err := api.readJson(w, r, &props)
	if err != nil {
		api.badRequestResponse(w, r, err)
		return
	}
	_, prvIdentityKey, err := user.CreateNewUser(props.Name, props.Email, props.Password)
	if err != nil {
		api.serverErrorResponse(w, r, err)
	}
	response := envelope{"message": "user has been Created Succesfully!", "identity_key": prvIdentityKey}
	err = api.writeJSON(w, 200, response, nil)
	if err != nil {
		api.serverErrorResponse(w, r, err)
	}
}

// Sessions----------------------

func (api *apiConfig) hndlSession(w http.ResponseWriter, r *http.Request) {
	order := r.Header.Get("task")
	switch order {
	case "create":
		api.createSession(w, r)
	}
}

func (api *apiConfig) createSession(w http.ResponseWriter, r *http.Request) {
	var entry struct {
		Beta    string `json:"beta"`
		Message string `json:"message"`
	}
	err := api.readJson(w, r, &entry)
	if err != nil {
		api.badRequestResponse(w, r, err)
		return
	}
	TempActiverUser := user.ActiveUser{}
	err = TempActiverUser.CreateSession(entry.Beta, entry.Message)
}
