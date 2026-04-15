package models

import (
	"database/sql"
	"errors"
	"marble/app/user"
)

var (
	ErrRecordNotFound = errors.New("Record Not Found")
)

type Models struct{
	Users user.UserModel
}

func NewModels(db *sql.DB) Models{
	return Models{
		Users: user.UserModel{DB: db},
	}
}