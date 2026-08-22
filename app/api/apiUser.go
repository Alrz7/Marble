package api

import (
	"marble/db"
	"marble/internal"
	"marble/internal/loggy"
	"marble/internal/validator"
	"net/http"
)

func (api *ApiConfig) handleUserUpdate(w http.ResponseWriter, r *http.Request) {
	var entry struct {
		UserId        internal.UserId `json:"userId"`
		Name          *string         `json:"name"`
		DisplayId     *string         `json:"username"`
		Email         *string         `json:"email"`
		ProfileAvatar *string         `json:"profileAvatar"`
	}
	err := api.readJson(w, r, &entry)
	if err != nil {
		appErr := loggy.Get(err).SetMessage("error while computing request body")
		api.badRequestResponse(w, r, appErr)
		return
	}

	v := validator.New()
	v.Check(entry.UserId > 0, "userId", "must be valid")
	if !v.Valid() {
		err := loggy.NewAppErr(loggy.ErrBadRequest).SetMessage("error while updating User-Data").SetParams(v.Errors)
		api.badRequestResponse(w, r, err)
		return
	}

	user, err := db.AppModels.UserModel.Get(entry.UserId)
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

	if entry.Name != nil {
		user.UserName = *entry.Name
	}
	if entry.DisplayId != nil {
		user.DisplayId = *entry.DisplayId
	}
	if entry.Email != nil {
		user.Email = *entry.Email
	}
	if entry.ProfileAvatar != nil {
		user.ProfileAvatar = *entry.ProfileAvatar
	}

	v.Check(len(user.UserName) <= 60, "name", "must not be more than 60 chars long")
	v.Check(len(user.UserName) != 0, "name", "must not be empty")
	v.Check(len(user.DisplayId) <= 60, "username", "must not be more than 60 chars long")
	v.Check(len(user.DisplayId) != 0, "username", "must not be empty")
	v.Check(len(user.Email) <= 150, "email", "must not be more than 150 chars long")
	v.Check(len(user.Email) != 0, "email", "must not be empty")
	if !v.Valid() {
		err := loggy.NewAppErr(loggy.ErrBadRequest).SetParams(v.Errors)
		api.badRequestResponse(w, r, err)
		return
	}

	err = db.AppModels.UserModel.Update(user)
	if err != nil {
		AppErr := loggy.Get(err).SetMessage("err while updating user")
		switch AppErr.Reason {
		case loggy.ErrNoRecord:
			api.badRequestResponse(w, r, AppErr)
		default:
			api.serverErrorResponse(w, r, AppErr)
		}
		return
	}
	err = api.writeJSON(w, http.StatusOK, envelope{"user": user}, nil)
	if err != nil {
		AppErr := loggy.Get(err)
		api.serverErrorResponse(w, r, AppErr)
	}
}

func (api *ApiConfig) handleDeleteAccount(w http.ResponseWriter, r *http.Request) {
	var entry struct {
		UserId internal.UserId `json:"userId"`
	}
	err := api.readJson(w, r, &entry)
	if err != nil {
		appErr := loggy.Get(err).SetReason(loggy.ErrBadRequest).SetMessage("error while computing request body")
		api.badRequestResponse(w, r, appErr)
		return
	}

	err = db.AppModels.UserModel.Delete(entry.UserId)
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
	err = api.writeJSON(w, http.StatusOK, envelope{"message": "User has beed removed successfully!"}, nil)
	if err != nil {
		AppErr := loggy.Get(err)
		api.serverErrorResponse(w, r, AppErr)
	}
}
