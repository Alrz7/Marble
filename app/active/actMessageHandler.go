package active

import (
	"context"
	"encoding/json"
	"errors"
	"marble/app/session"
	"marble/db"
	"marble/internal"
	"time"
)

func HndlSendMessage(req *Request) error {
	entry := struct {
		AudienceId     internal.UserId `json:"audienceId"`
		SessionId      uint64          `json:"sessionId"`
		Message        string          `json:"message"`
		MessageEventId int             `json:"messageEventId"`
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
	err = req.user.SendMessage(req.ctx, session, entry.Message)
	if err != nil {
		actServerErrorResponse(req.conn, err)
		return err
	}
	req.onSendMessageEventResponce(session.Id, entry.MessageEventId, "sent")
	return nil
}

func (u *ActvUser) onGenerateNewMessage(S *session.Session, content string) (*session.Message, error) {
	var newMessage = session.Message{
		SessionId: S.Id,
		SenderId:  u.Id,
		Content:   content,
		CreatedAt: time.Now(),
		Profile:   "openpgp", // this is a FixedVal for now, i'll change it later
	}
	return &newMessage, nil
}

func (u *ActvUser) SendMessage(ctx context.Context, S *session.Session, content string) error {
	if u.Id != S.Alpha && u.Id != S.Beta {
		return errors.New("user is Not subscribed to this session")
	}
	newMessage, err := u.onGenerateNewMessage(S, content)
	if err != nil {
		return err
	}

	sent := u.onDeliverMessage(S, newMessage)
	if !sent {
		subctx, cancel := context.WithTimeout(ctx, time.Second*3)
		defer cancel()
		err = db.AppModels.MessageModel.Insert(subctx, newMessage)
		if err != nil {
			return err
		}
	}
	return nil
}

func (u *ActvUser) onDeliverMessage(S *session.Session, message *session.Message) bool {
	var audienceId internal.UserId
	switch u.Id {
	case S.Alpha:
		audienceId = S.Beta
	case S.Beta:
		audienceId = S.Alpha
	}
	userOnlineConn, ok := GetConnByUserId(audienceId)
	if !ok {
		return false
	}
	body := envelope{"sessionId": S.Id, "messages": []*session.Message{message}}
	headers := RequestHeaders{"task": "add"}
	sendHandlerResponse(userOnlineConn, StatusPending, "messages", headers, body)
	return true
}
