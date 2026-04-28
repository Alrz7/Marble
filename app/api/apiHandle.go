package api

import (
	"fmt"
	"marble/app/active"
	"marble/app/users"
	"marble/encryption/pgp"
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

// Sessions----------------------

func (api *apiConfig) hndlSession(w http.ResponseWriter, r *http.Request) {
	order := r.Header.Get("task")
	switch order {
	case "create":
		api.createSession(w, r)
	case "send":
		api.SendSessionMessage(w, r)
	}
}

func (api *apiConfig) createSession(w http.ResponseWriter, r *http.Request) {
	var entry struct {
		Alpha       string `json:"alpha"`
		AlphaPrvKey string `json:"alpha_prv_key"`
		Beta        string `json:"beta"`
		Message     string `json:"message"`
	}
	err := api.readJson(w, r, &entry)
	if err != nil {
		api.badRequestResponse(w, r, err)
		return
	}
	ActvUser, err := active.GetActiveUser(entry.Alpha)
	if err != nil {
		api.serverErrorResponse(w, r, err)
		return
	}
	ActvUser.PrvIdentityKey, err = pgp.GetKeyfromArmored(entry.AlphaPrvKey)
	if err != nil {
		err = fmt.Errorf("there was an error while getting IdentityKey from armored: %v", err)
		api.serverErrorResponse(w, r, err)
		return
	}
	err = ActvUser.CreateSession(entry.Beta, entry.Message)
	if err != nil {
		err = fmt.Errorf("there was an error while creating the session: %v", err)
		api.serverErrorResponse(w, r, err)
		return
	}
	response := envelope{
		"error":   false,
		"message": "Session has been Created Succesfully!",
	}
	err = api.writeJSON(w, 201, response, nil)
	if err != nil {
		api.serverErrorResponse(w, r, err)
	}
}

func (api *apiConfig) SendSessionMessage(w http.ResponseWriter, r *http.Request) {
	var entry struct {
		Alpha       string `json:"alpha"`
		AlphaPrvKey string `json:"alpha_prv_key"`
		Beta        string `json:"beta"`
		Message     string `json:"message"`
	}
	err := api.readJson(w, r, &entry)
	if err != nil {
		api.badRequestResponse(w, r, err)
		return
	}
	ActvUser, err := active.GetActiveUser(entry.Alpha)
	if err != nil {
		api.serverErrorResponse(w, r, err)
		return
	}
	ActvUser.PrvIdentityKey, err = pgp.GetKeyfromArmored(entry.AlphaPrvKey)
	if err != nil {
		err = fmt.Errorf("there was an error while getting IdentityKey from armored: %v", err)
		api.serverErrorResponse(w, r, err)
		return
	}
	err = ActvUser.SendSessionMessage(entry.Beta, entry.Message)
	if err != nil {
		err = fmt.Errorf("there was an error while sending the message: %v", err)
		api.serverErrorResponse(w, r, err)
		return
	}
	response := envelope{
		"error":   false,
		"message": "Message has been sent Successfully!",
	}
	err = api.writeJSON(w, 200, response, nil)
	if err != nil {
		api.serverErrorResponse(w, r, err)
	}

}
