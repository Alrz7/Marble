package models

// import (
// 	"database/sql"
// 	"errors"
// 	"marble/app/user"
// 	"marble/enc/pgp"
// )

// var (
// 	ErrRecordNotFound = errors.New("Record Not Found")
// )

// type Models struct {
// 	Users    user.UserModel
// 	Sessions pgp.SessionModel
// }

// func NewModels(db *sql.DB) Models {
// 	return Models{
// 		Users:    user.UserModel{DB: db},
// 		Sessions: pgp.SessionModel{DB: db},
// 	}
// }
