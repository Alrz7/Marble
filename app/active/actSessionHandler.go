package active

import (
	"context"
	"encoding/json"
	"marble/app/session"
	"marble/app/users"
	"marble/db"
	"marble/internal"
	"marble/internal/loggy"
	"time"

	"github.com/gorilla/websocket"
)

func HndlCreateSession(req *Request) error {
	entry := struct {
		AudienceId     int                `json:"audienceId"`
		Message        string             `json:"message"`
		MessageEventId int                `json:"messageEventId"`
		SessionEventId internal.SessionId `json:"sessionEventId"`
	}{}
	err := json.Unmarshal([]byte(req.Body), &entry)
	if err != nil {
		actBadRequestResponse(req.conn, err)
		return err
	}

	subctx, cancel := context.WithTimeout(req.ctx, time.Second*3)
	defer cancel()

	Beta, err := db.AppModels.UserModel.Get(subctx, internal.UserId(entry.AudienceId))
	if err != nil {
		actNotFoundResponse(req.conn, err)
		return err
	}

	tx, err := db.Global.Begin()
	if err != nil {
		return loggy.EchoWithMessage("failed to start db transaction", err)
	}

	txUserModel := users.UserModel{Db: tx}
	txSessionModel := session.SessionModel{Db: tx}

	newSeq, err := txUserModel.IncreaseSessionLastSeq(subctx, req.user.Id, Beta.Id)
	if err != nil {
		txerr := tx.Rollback()
		appErr := loggy.Get(err)
		if txerr != nil {
			appErr.AddParam("txError", txerr.Error())
		}
		appErr.Log()
		return err
	}

	newSession, err := txSessionModel.CreateSession(subctx, req.user.Id, Beta.Id, newSeq)
	if err != nil {
		txerr := tx.Rollback()
		appErr := loggy.Get(err)
		if txerr != nil {
			appErr.AddParam("txError", txerr.Error())
		}
		appErr.Log()
		return err
	}

	err = tx.Commit()
	if err != nil {
		loggy.Get(err).Log()
		return err
	}

	err = req.user.onDeliverSession(req.ctx, newSession, Beta, entry.Message)
	if err != nil {
		loggy.Get(err).Log()
		return err
	}

	// we can add a notif for reading the sgined messages on beta's Reading message side...
	messageEventResponse := createNewMessageResponse(entry.SessionEventId, entry.MessageEventId, "sent")
	req.onSendSessionEventResponce(entry.SessionEventId, newSession, Beta, true, messageEventResponse)
	return nil
}

func (u *ActvUser) onDeliverSession(ctx context.Context, session *session.Session, audience *users.User, content string) error {
	userOnlineConn, isOnline := GetConnByUserId(audience.Id)

	newMessage, err := u.onGenerateNewMessage(session, content)
	if err != nil {
		loggy.Get(err).Log()
		return err
	}
	if isOnline {
		u.OnAddSession(userOnlineConn, session, u.User, newMessage)
	} else {
		subctx, cancel := context.WithTimeout(ctx, time.Second*3)
		defer cancel()
		err = db.AppModels.MessageModel.Insert(subctx, newMessage)
	}
	return err
}

func (u *ActvUser) OnAddSession(conn *websocket.Conn, session *session.Session, audience *users.User, message *session.Message) {
	sendingSession := envelope{"sessionId": session.Id, "seq": session.Seq, "audience": internal.Audience{Name: audience.UserName,
		UserId:        audience.Id,
		DisplayId:     audience.DisplayId,
		ProfileAvatar: audience.ProfileAvatar,
		ArmedPubKey:   audience.PgpProfile.PublicKey}}

	Body := envelope{"session": &sendingSession}
	if message != nil {
		Body["message"] = message
	}
	headers := RequestHeaders{"task": "add"}
	sendHandlerResponse(conn, StatusPending, "sessions", headers, Body)
}

func HndlDeleteSession(req *Request) error {
	entry := struct {
		SessionId uint64 `json:"sessionId"`
	}{}
	err := json.Unmarshal([]byte(req.Body), &entry)
	if err != nil {
		actBadRequestResponse(req.conn, err)
		return err
	}
	subctx, cancel := context.WithTimeout(req.ctx, time.Second*3)
	defer cancel()

	session, err := req.user.GetSessionById(subctx, internal.SessionId(entry.SessionId))
	if err != nil {
		actNotFoundResponse(req.conn, err)
		return err
	}
	if req.user.Id == session.Alpha || req.user.Id == session.Beta {
		err = db.AppModels.SessionModel.Delete(subctx, session.Id)
		if err != nil {
			return err
		}
	} else {
		return loggy.NewAppErr("this Client doesn't have permision for this operation")
	}
	return nil
}
