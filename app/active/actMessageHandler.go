package active

import (
	"encoding/json"
	"errors"
	"marble/app/session"
	"marble/db"
	"marble/internal"
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
	session, err := req.user.GetSessionById(internal.SessionId(entry.SessionId))
	if err != nil {
		actNotFoundResponse(req.conn, err)
		return err
	}
	err = req.user.SendMessage(session, entry.Message)
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
		Profile:   "openpgp", // this is a FixedVal for now, i'll change it later
	}
	// newSeq, err := db.AppModels.SessionModel.IncreaseMessageLastSeq(S.Id)
	// if err != nil {
	// 	return nil, err
	// }
	// newMessage.Seq = newSeq
	return &newMessage, nil
}

func (u *ActvUser) SendMessage(S *session.Session, content string) error {
	if u.Id != S.Alpha && u.Id != S.Beta {
		return errors.New("user is Not subscribed to this session")
	}
	newMessage, err := u.onGenerateNewMessage(S, content)

	sent := u.onDeliverMessage(S, newMessage)
	if !sent {
		err = db.AppModels.MessageModel.Insert(newMessage)
		// err = db.AppModels.MessageModel.SendMessage(&newMessage)
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
