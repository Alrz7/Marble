package users

import (
	"marble/enc/pgp"
	"marble/internal"
)

type User struct {
	Id             internal.UserId
	DisplayId      string
	UserName       string
	Email          string
	SessionLastSeq int
	ProfileAvatar  string
	PgpProfile     pgp.Profile
}

type UserModel struct {
	Db internal.DBTX
}
