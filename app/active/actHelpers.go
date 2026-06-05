package active

import (
	"encoding/json"
	"marble/app/users"
	"marble/internal"

	"github.com/gorilla/websocket"
)

func sendHandlerResponse(conn *websocket.Conn, status RequestStatus, channel string, headers RequestHeaders, body any) {
	bodyInBytes, err := json.Marshal(body)
	if err != nil {
		DefaultLogger.Error(err)
	}
	resp := Request{
		conn:    conn,
		Status:  status,
		Channel: channel,
		Headers: headers,
		Body:    string(bodyInBytes),
	}
	err = resp.sendRequest()
	if err != nil {
		actServerErrorResponse(conn, err)
	}
}

func returnUnsyncedSessions(serverside, clientSide existingAudiences) ([]Session, error) {
	for audienceId, _ := range clientSide {
		delete(serverside, audienceId)
	}
	res := []Session{}
	if len(serverside) == 0 {
		return res, nil
	}

	for audienceId, sessionId := range serverside {
		user, err := users.GetUserProfile(audienceId)
		if err != nil && err != internal.ErrRecordNotFound {
			return res, err
		}
		audience := internal.Audience{
			Name:        user.UserName,
			UserId:      user.Id,
			DisplayId:   user.DisplayId,
			ArmedPubKey: user.PgpProfile.PubIdentityKey,
		}
		res = append(res, Session{SessionID: sessionId, Beta: audience})
	}
	return res, nil
}
