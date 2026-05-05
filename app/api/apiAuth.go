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
	var entry struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Password string `json:"password"`
		PubIdentKey string `json:"pubIdentKey"`
	}
	err := api.readJson(w, r, &entry)
	if err != nil {
		api.badRequestResponse(w, r, err)
		return
	}
	newUser, err := users.CreateNewUser(entry.Name, entry.Email, entry.Password, entry.PubIdentKey)
	if err != nil {
		api.serverErrorResponse(w, r, err)
	}
	response := envelope{
		"error":        false,
		"message":      "user has been Created Succesfully!",
		"id": newUser.Id,
		"adress": newUser.PgpProfile.Address,
	}
	err = api.writeJSON(w, http.StatusCreated, response, nil)
	if err != nil {
		api.serverErrorResponse(w, r, err)
	}
}
