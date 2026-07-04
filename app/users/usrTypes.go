package users

import (
	"database/sql"
	"marble/encryption/pgp"
	"marble/internal"
)

type User struct {
	UserName   string
	Email      string
	DisplayId  string
	Id         internal.UserId
	PgpProfile pgp.Profile
}

type UserModel struct {
	Db *sql.DB
}
