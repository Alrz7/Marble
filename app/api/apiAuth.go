package api

import (
	"marble/app/users"
	"marble/db"
	"marble/enc"
	"marble/internal/loggy"
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
		appErr := loggy.Get(err).SetReason(loggy.ErrBadRequest).SetMessage("error while computing request body")
		api.badRequestResponse(w, r, appErr)
		return
	}
	v := validator.New()
	v.Check(len(entry.Name) <= 60, "name", "must not be more than 60 chars long")
	v.Check(len(entry.Name) != 0, "name", "must not be empty")
	v.Check(len(entry.DisplayId) <= 60, "username", "must not be more than 60 chars long")
	v.Check(len(entry.DisplayId) != 0, "username", "must not be empty")
	v.Check(len(entry.Email) <= 150, "email", "must not be more than 150 chars long")
	v.Check(len(entry.Email) != 0, "email", "must not be empty")

	if !v.Valid() {
		err := loggy.NewAppErr(loggy.ErrBadRequest).SetParams(v.Errors)
		api.badRequestResponse(w, r, err)
		return
	}

	newUser, err := users.CreateNewUser(entry.Name, entry.Email, entry.DisplayId, entry.PubIdentKey)
	if err != nil {
		api.serverErrorResponse(w, r, loggy.Get(err).SetMessage("error while creating user").SetReason(loggy.ErrInternalServer))
		return
	}

	authKeyHash, err := enc.HashUserAuthKey(entry.AuthKey)

	err = newUser.Save(db.AppModels.UserModel, authKeyHash, db.AppModels.ProfileModel)
	if err != nil {
		AppErr := loggy.Get(err)
		switch AppErr.Reason {
		case loggy.ErrDuplicateRecord:
			api.badRequestResponse(w, r, AppErr)
		default:
			api.serverErrorResponse(w, r, AppErr)
		}
		return
	}
	// err = newUser.fakeSave()
	accessToken, err := GetNewToken(newUser.Id, api.JwtSecret, "access", 15*time.Minute)
	if err != nil {
		api.serverErrorResponse(w, r, loggy.Get(err).SetMessage("error while getting new User Access Token").SetReason(loggy.ErrInternalServer))
		return
	}
	refreshToken, err := GetNewToken(newUser.Id, api.JwtSecret, "refresh", 30*24*time.Hour)
	if err != nil {
		api.serverErrorResponse(w, r, loggy.Get(err).SetMessage("error while getting new User Refresh Token").SetReason(loggy.ErrInternalServer))
		return
	}

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
		api.serverErrorResponse(w, r, loggy.Get(err).SetReason(loggy.ErrInternalServer))
		return
	}
}

func (api *ApiConfig) handleSignIn(w http.ResponseWriter, r *http.Request) {
	var entry struct {
		DisplayId string `json:"username"`
		Password  string `json:"password"`
	}
	err := api.readJson(w, r, &entry)
	if err != nil {
		api.badRequestResponse(w, r, loggy.Get(err).SetReason(loggy.ErrBadRequest).SetMessage("error while computing request body"))
		return
	}

	v := validator.New()
	v.Check(len(entry.DisplayId) <= 60, "username", "must not be more than 60 chars long")
	v.Check(len(entry.DisplayId) != 0, "username", "must not be empty")

	if !v.Valid() {
		err := loggy.NewAppErr(loggy.ErrBadRequest).SetParams(v.Errors)
		api.badRequestResponse(w, r, err)
		return
	}

	existingUser, err := db.AppModels.UserModel.GetByDisplayId(entry.DisplayId)
	if err != nil {
		AppErr := loggy.Get(err)
		switch AppErr.Reason {
		case loggy.ErrNoRecord:
			api.badRequestResponse(w, r, AppErr)
		default:
			api.serverErrorResponse(w, r, AppErr)
		}
		return
	}

	userExistingAuthHash, err := db.AppModels.UserModel.GetUserAuthHash(existingUser.Id)
	if err != nil {
		api.serverErrorResponse(w, r, loggy.Get(err))
		return
	}

	isUserValid := enc.CheckAuthHash(entry.Password, userExistingAuthHash)
	if !isUserValid {
		api.badRequestResponse(w, r, loggy.NewAppErr(loggy.ErrValidationFailed).SetMessage("username/password was not valid!"))
		return
	}

	accessToken, err := GetNewToken(existingUser.Id, api.JwtSecret, "access", 15*time.Minute)
	if err != nil {
		api.serverErrorResponse(w, r, loggy.Get(err).SetMessage("error while getting new User Access Token").SetReason(loggy.ErrInternalServer))
		return
	}
	refreshToken, err := GetNewToken(existingUser.Id, api.JwtSecret, "refresh", 30*24*time.Hour)
	if err != nil {
		api.serverErrorResponse(w, r, loggy.Get(err).SetMessage("error while getting new User Refresh Token").SetReason(loggy.ErrInternalServer))
		return
	}

	response := envelope{
		"error":        false,
		"message":      "User has Logged Succesfully!",
		"accessToken":  accessToken,
		"refreshToken": refreshToken,
	}
	err = api.writeJSON(w, http.StatusOK, response, nil)
	if err != nil {
		api.serverErrorResponse(w, r, loggy.Get(err).SetReason(loggy.ErrInternalServer))
	}
}

func (api *ApiConfig) handleDeleteAccount(w http.ResponseWriter, r *http.Request) {
	//...
}
