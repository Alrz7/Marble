package api

import (
	"marble/app/active"
	"marble/app/users"
	"marble/internal"
	"net/http"
)

// Accounts----------------------

func (api *apiConfig) hndlAccount(w http.ResponseWriter, r *http.Request) {
	order := r.Header.Get("task")
	switch order {
	case "create":
		api.createAccount(w, r)
	case "signin":
		api.signInAccount(w, r)
		// case "delete":
		// not decided yet... (this needs auth works)
	}
}

func (api *apiConfig) createAccount(w http.ResponseWriter, r *http.Request) {
	var entry struct {
		Name        string `json:"name"`
		Email       string `json:"email"`
		Password    string `json:"password"`
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
		"error":      false,
		"message":    "user has been Created Succesfully!",
		"id":         newUser.Id,
		"display_id": newUser.DisplayId,
	}
	err = api.writeJSON(w, http.StatusCreated, response, nil)
	if err != nil {
		api.serverErrorResponse(w, r, err)
	}
}

func (api *apiConfig) signInAccount(w http.ResponseWriter, r *http.Request) {
	var entry struct {
		DisplayId string `json:"display_id"`
		Password  string `json:"password"`
	}
	err := api.readJson(w, r, &entry)
	if err != nil {
		api.badRequestResponse(w, r, err)
		return
	}
	Mod := users.UserModel{DB: internal.App.Db}
	existingUser, err := Mod.SearchOneByDisplayId(entry.DisplayId)
	if err != nil {
		api.serverErrorResponse(w, r, err)
	}
	// password validation goes here
	newActiveUser := active.ActvUser{
		User: existingUser,
	}
	active.Insert(&newActiveUser)
	response := envelope{
		"error":   false,
		"message": "User has Logged Succesfully!",
		"name": existingUser.UserName,
		"id":      existingUser.Id,
		"display_id": existingUser.DisplayId,
		"email":   existingUser.Email,
	}
	err = api.writeJSON(w, http.StatusCreated, response, nil)
	if err != nil {
		api.serverErrorResponse(w, r, err)
	}
}
