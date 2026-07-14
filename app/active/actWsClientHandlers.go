package active

import (
	"encoding/json"
	"marble/db"
	"marble/internal"
)

// Sessions

func HndlSyncSessions(req *Request) error {
	DefaultLogger.Info("got sync request!")
	var entry struct {
		lastSessionEvent int
	}
	err := json.Unmarshal([]byte(req.Body), &entry)
	if err != nil {
		DefaultLogger.Error(err)
	}
	if req.user.SessionLastSeq > entry.lastSessionEvent {
		sessions, err := db.AppModels.SessionModel.GetSessionsByEvent(req.user.Id, entry.lastSessionEvent, 5)
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
		Body := envelope{"sessions": sessions}
		headers := RequestHeaders{"task": "add"}
		DefaultLogger.Info(Body)
		sendHandlerResponse(req.conn, StatusPending, "sessions", headers, Body)
	}

	return nil
}

// Messages

func HndlSyncMessages(req *Request) error {
	return nil
}
