package user

import (
	"github.com/ProtonMail/gopenpgp/v3/crypto"
	"marble/encryption/pgp"
)

type User struct {
	UserName       string
	Email          string
	Id             uint32
	pgpProfile pgp.PgpProfile
}

type ActiveUser struct{
	PrvIdentityKey *crypto.Key
	User
}