package api

import (
	"errors"
	"marble/app/active"
	"marble/app/users"
	"marble/db"
	"marble/enc"
	"marble/internal"
	"marble/internal/loggy"
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

	userExistingAuthHash, err := db.AppModels.UserModel.GetUserAuthHash(existingUser.Id)
	if err != nil {
		api.serverErrorResponse(w, r, err)
		return
	}

	isValid := enc.CheckAuthHash(entry.Password, userExistingAuthHash)
	if !isValid {
		api.serverErrorResponse(w, r, errors.New("username/password was not valid!"))
		return
	}

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

func (api *apiConfig) getNewTokens(w http.ResponseWriter, r *http.Request) {
	var entry struct {
		UserId       internal.UserId `json:"userId"`
		RefreshToken string          `json:"refreshToken"`
	}
	err := api.readJson(w, r, &entry)
	if err != nil {
		api.badRequestResponse(w, r, err)
		return
	}
	existingUser, err := db.AppModels.UserModel.Get(entry.UserId)
	if err != nil {
		api.serverErrorResponse(w, r, err)
		return
	}

	accessToken, err := GetNewToken(existingUser.Id, api.jwtSecret, "access", 15*time.Minute)
	refreshToken, err := GetNewToken(existingUser.Id, api.jwtSecret, "refresh", 30*24*time.Hour)

	response := envelope{
		"error":        false,
		"accessToken":  accessToken,
		"refreshToken": refreshToken,
	}
	err = api.writeJSON(w, http.StatusCreated, response, nil)
	if err != nil {
		api.serverErrorResponse(w, r, err)
	}
}

func GetNewToken(userId internal.UserId, jwtSecret []byte, tokenType string, duration time.Duration) (string, error) {
	claims := active.Claims{
		UserId:    userId,
		TokenType: tokenType,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(duration)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	signedToken, err := token.SignedString(jwtSecret)
	if err != nil {
		return "", loggy.Sayr("failed to sign token: %w", err)
	}

	return signedToken, nil
}
