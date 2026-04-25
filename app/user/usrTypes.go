package user

import (
	"database/sql"
	"marble/encryption/pgp"

	"github.com/ProtonMail/gopenpgp/v3/crypto"
)

type User struct {
	UserName string
	Email    string
	Id       uint32
	PgpProfile  pgp.Profile
}

type ActiveUser struct {
	PrvIdentityKey *crypto.Key
	User           *User
}

type UserModel struct {
	DB *sql.DB
}
