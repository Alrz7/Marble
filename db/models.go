package db

import (
	"database/sql"
	"marble/app/session"
	"marble/app/users"
	"marble/enc/pgp"
	"marble/internal/loggy"
)

type Models struct {
	UserModel    users.UserModel
	SessionModel session.SessionModel
	MessageModel session.MessageModel
	ProfileModel pgp.ProfileModel
}

var AppModels Models

func InitModels() (*sql.DB, *Models, error) {
	db, err := DefaulfConfig.connect()
	if err != nil {
		return nil, nil, err
	}
	if db == nil {
		return nil, nil, loggy.NewAppErr(loggy.ErrDatabaseUnavailable).SetMessage("an error while trying to connect to database: db is nil")
	}
	AppModels.UserModel = users.UserModel{Db: db}
	AppModels.SessionModel = session.SessionModel{Db: db}
	AppModels.MessageModel = session.MessageModel{Db: db}
	AppModels.ProfileModel = pgp.ProfileModel{Db: db}
	return db, &AppModels, nil
}
