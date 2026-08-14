package api

import (
	"errors"
	"marble/app/users"
	"marble/db"
	"marble/enc"
	"marble/internal/validator"
	"net/http"
	"time"
)

func (api *ApiConfig) handleSignUp(w http.ResponseWriter, r *http.Request) {
	var entry struct {
		Name        string `json:"name"`
		DisplayId   string `json:"username"`
		Email       string `json:"email"`
		AuthKey     string `json:"password"`
		PubIdentKey string `json:"pubIdentKey"`
	}

	err := api.readJson(w, r, &entry)
	if err != nil {
		api.badRequestResponse(w, r, err)
		return
	}
	v := validator.New()
	v.Check(len(entry.Name) > 60, "Name", "must not be more than 60 chars long")
	v.Check(len(entry.Name) == 0, "Name", "must not be empty")
	v.Check(len(entry.DisplayId) > 60, "DisplayId", "must not be more than 60 chars long")
	v.Check(len(entry.DisplayId) == 0, "DisplayId", "must not be empty")
	v.Check(len(entry.Email) > 150, "Email", "must not be more than 60 chars long")
	v.Check(len(entry.Email) == 0, "Email", "must not be empty")

	newUser, err := users.CreateNewUser(entry.Name, entry.Email, entry.DisplayId, entry.PubIdentKey)
	if err != nil {
		api.serverErrorResponse(w, r, err)
	}

	authKeyHash, err := enc.HashUserAuthKey(entry.AuthKey)

	err = newUser.Save(db.AppModels.UserModel, authKeyHash, db.AppModels.ProfileModel)
	if err != nil {
		api.serverErrorResponse(w, r, err)
	}
	// err = newUser.fakeSave()
	accessToken, err := GetNewToken(newUser.Id, api.JwtSecret, "access", 15*time.Minute)
	refreshToken, err := GetNewToken(newUser.Id, api.JwtSecret, "refresh", 30*24*time.Hour)

	response := envelope{
		"error":        false,
		"message":      "user has been Created Succesfully!",
		"id":           newUser.Id,
		"display_id":   newUser.DisplayId,
		"accessToken":  accessToken,
		"refreshToken": refreshToken,
	}
	err = api.writeJSON(w, http.StatusCreated, response, nil)
	if err != nil {
		api.serverErrorResponse(w, r, err)
	}
}

func (api *ApiConfig) handleSignIn(w http.ResponseWriter, r *http.Request) {
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

	userExistingAuthHash, err := db.AppModels.UserModel.GetUserAuthHash(existingUser.Id)
	if err != nil {
		api.serverErrorResponse(w, r, err)
		return
	}

	isUserValid := enc.CheckAuthHash(entry.Password, userExistingAuthHash)
	if !isUserValid {
		api.serverErrorResponse(w, r, errors.New("username/password was not valid!"))
		return
	}

	accessToken, err := GetNewToken(existingUser.Id, api.JwtSecret, "access", 15*time.Minute)
	refreshToken, err := GetNewToken(existingUser.Id, api.JwtSecret, "refresh", 30*24*time.Hour)

	response := envelope{
		"error":        false,
		"message":      "User has Logged Succesfully!",
		"accessToken":  accessToken,
		"refreshToken": refreshToken,
	}
	err = api.writeJSON(w, http.StatusCreated, response, nil)
	if err != nil {
		api.serverErrorResponse(w, r, err)
	}
}

func (api *ApiConfig) handleDeleteAccount(w http.ResponseWriter, r *http.Request) {
	//...
}
