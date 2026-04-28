package users

import (
	"database/sql"
	"marble/encryption/pgp"
)

type User struct {
	UserName   string
	Email      string
	Id         int32
	PgpProfile pgp.Profile
}

type UserModel struct {
	DB *sql.DB
}
