package active

import (
	"encoding/json"
	"marble/db"
	"marble/internal"
)

// Sessions

func HndlSyncSessions(req *Request) error {
	var entry struct {
		LastSessionEvent int `json:"lastSessionEvent"`
	}
	err := json.Unmarshal([]byte(req.Body), &entry)
	if err != nil {
		DefaultLogger.Error(err)
	}
	Limit := 5
	if req.user.SessionLastSeq > entry.LastSessionEvent {
		sessions, err := db.AppModels.SessionModel.GetSessionsByEvent(req.user.Id, entry.LastSessionEvent, Limit)
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
		hasMore := len(sessions) == Limit
		Body := envelope{"changes": envelope{"add": sessions}, "hasMore": hasMore}
		headers := RequestHeaders{"task": "sync"}
		// DefaultLogger.Info(Body)
		sendHandlerResponse(req.conn, StatusPending, "sessions", headers, Body)
	}
	return nil
}

// Messages

func HndlSyncMessages(req *Request) error {
	return nil
}
