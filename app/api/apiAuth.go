package api

import (
	"marble/app/users"
	"net/http"
)

// Accounts----------------------

func (api *apiConfig) hndlAccount(w http.ResponseWriter, r *http.Request) {
	order := r.Header.Get("task")
	switch order {
	case "create":
		api.createAccount(w, r)
		// case "delete":
		// not decided yet... (this needs auth works)
	}
}

func (api *apiConfig) createAccount(w http.ResponseWriter, r *http.Request) {
	var props struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	err := api.readJson(w, r, &props)
	if err != nil {
		api.badRequestResponse(w, r, err)
		return
	}
	newUser, prvIdentityKey, err := users.CreateNewUser(props.Name, props.Email, props.Password)
	if err != nil {
		api.serverErrorResponse(w, r, err)
	}
	sndIdentKey, err := prvIdentityKey.Armor()
	response := envelope{
		"error":        false,
		"message":      "user has been Created Succesfully!",
		"identity_key": sndIdentKey,
		"user_address": newUser.PgpProfile.Address,
	}
	err = api.writeJSON(w, http.StatusCreated, response, nil)
	if err != nil {
		api.serverErrorResponse(w, r, err)
	}
}
