package api

import (
	"marble/app/active"
	"marble/app/users"
	"marble/db"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// Accounts----------------------

func (api *apiConfig) handleAccount(w http.ResponseWriter, r *http.Request) {
	order := r.Header.Get("task")
	switch order {
	case "create":
		api.createAccount(w, r)
	case "signin":
		api.signIn(w, r)
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
	err = newUser.Save(db.AppModels.UserModel, db.AppModels.ProfileModel)
	if err != nil {
		api.serverErrorResponse(w, r, err)
	}
	// err = newUser.fakeSave()

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

func (api *apiConfig) signIn(w http.ResponseWriter, r *http.Request) {
	var entry struct {
		DisplayId string `json:"display_id"`
		Password  string `json:"password"`
	}
	err := api.readJson(w, r, &entry)
	if err != nil {
		api.badRequestResponse(w, r, err)
		return
	}
	existingUser, err := db.AppModels.UserModel.GetByDisplayId(entry.DisplayId)
	if err != nil {
		api.serverErrorResponse(w, r, err)
		return
	}
	// password validation goes here

	claims := active.Claims{
		UserId: existingUser.Id,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(1 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signedToken, err := token.SignedString(api.jwtSecret)
	if err != nil {
		api.serverErrorResponse(w, r, err)
		return
	}
	response := envelope{
		"error":   false,
		"message": "User has Logged Succesfully!",
		"token":   signedToken,
	}
	err = api.writeJSON(w, http.StatusCreated, response, nil)
	if err != nil {
		api.serverErrorResponse(w, r, err)
	}
}
