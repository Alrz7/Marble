package active

import (
	"encoding/json"
	"marble/db"
	"marble/internal"
	"marble/internal/loggy"
)

// Sessions

func HndlSyncSessions(req *Request) error {
	var entry struct {
		LastSessionEvent int `json:"lastSessionEvent"`
	}
	err := json.Unmarshal([]byte(req.Body), &entry)
	if err != nil {
		return err
	}
	limit := 5
	if req.user.SessionLastSeq > entry.LastSessionEvent {
		sessions, err := db.AppModels.SessionModel.GetSessionsByEvent(req.user.Id, entry.LastSessionEvent, limit)
		if err != nil {
			return err
		}
		for _, clientSession := range sessions {
			audience, err := db.AppModels.UserModel.GetUserProfile(clientSession.Audience.UserId)
			if err != nil {
				actNotFoundResponse(req.conn, err)
			}
			clientSession.Audience = internal.Audience{
				Name:          audience.UserName,
				UserId:        audience.Id,
				DisplayId:     audience.DisplayId,
				ProfileAvatar: audience.ProfileAvatar,
				ArmedPubKey:   audience.PgpProfile.PublicKey,
			}
		}
		hasMore := len(sessions) == limit
		body := envelope{"changes": envelope{"add": sessions}, "hasMore": hasMore}
		headers := RequestHeaders{"task": "sync"}
		sendHandlerResponse(req.conn, StatusApproved, "sessions", headers, body)
	}
	body := envelope{"changes": nil, "hasMore": false}
	headers := RequestHeaders{"task": "sync"}
	sendHandlerResponse(req.conn, StatusApproved, "sessions", headers, body)
	return nil
}

// Messages

func HndlSyncMessages(req *Request) error {
	var entry struct {
		SessionId      internal.SessionId `json:"sessionId"`
		LastMessageSeq int                `json:"lastMessageSeq"`
	}
	err := json.Unmarshal([]byte(req.Body), &entry)
	if err != nil {
		return err
	}
	session, err := req.user.GetSessionById(entry.SessionId)
	if err != nil {
		return err
	}
	var senderId internal.UserId
	switch req.user.Id {
	case session.Alpha:
		senderId = session.Beta
	case session.Beta:
		senderId = session.Alpha
	default:
		return loggy.NewAppErr("user is not a subscribed to the session")
	}
	if entry.LastMessageSeq != 0 {
		err = db.AppModels.MessageModel.DeleteMessagesByEvent(entry.SessionId, senderId, entry.LastMessageSeq)
		if err != nil {
			return err
		}
	}

	limit := 5
	messages, err := db.AppModels.MessageModel.GetMessagesByEvent(entry.SessionId, senderId, limit)
	if err != nil {
		return err
	}
	hasMore := len(messages) == limit
	body := envelope{"sessionId": entry.SessionId, "changes": envelope{"add": messages}, "hasMore": hasMore}
	headers := RequestHeaders{"task": "sync"}
	sendHandlerResponse(req.conn, StatusPending, "messages", headers, body)
	return nil
}

func HndlClearSyncedMessage(req *Request) error {
	var entry struct {
		SessionId      internal.SessionId `json:"sessionId"`
		LastMessageSeq int                `json:"lastMessageSeq"`
	}
	err := json.Unmarshal([]byte(req.Body), &entry)
	if err != nil {
		return err
	}
	session, err := req.user.GetSessionById(entry.SessionId)
	if err != nil {
		return err
	}
	var senderId internal.UserId
	switch req.user.Id {
	case session.Alpha:
		senderId = session.Beta
	case session.Beta:
		senderId = session.Alpha
	default:
		return loggy.NewAppErr("user is not a subscribed to the session")
	}
	if entry.LastMessageSeq != 0 {
		err = db.AppModels.MessageModel.DeleteMessagesByEvent(entry.SessionId, senderId, entry.LastMessageSeq)
		if err != nil {
			return err
		}
	}
	return nil
}
