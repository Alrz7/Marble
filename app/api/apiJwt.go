package api

import (
	"marble/app/active"
	"marble/db"
	"marble/internal"
	"marble/internal/loggy"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func (api *ApiConfig) HandleGetTokens(w http.ResponseWriter, r *http.Request) {
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

	accessToken, err := GetNewToken(existingUser.Id, api.JwtSecret, "access", 15*time.Minute)
	refreshToken, err := GetNewToken(existingUser.Id, api.JwtSecret, "refresh", 30*24*time.Hour)

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
		return "", loggy.EchoWithMessage("failed to sign token: %w", err)
	}

	return signedToken, nil
}
