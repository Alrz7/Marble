package active

import (
	"encoding/json"

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

// func returnUnsyncedSessions(serverside, clientSide existingAudiences) ([]session.Session, error) {
// 	for audienceId, _ := range clientSide {
// 		delete(serverside, audienceId)
// 	}
// 	res := []session.Session{}
// 	if len(serverside) == 0 {
// 		return res, nil
// 	}
// 	for audienceId, sessionId := range serverside {
// 		user, err := db.AppModels.UserModel.GetUserProfile(audienceId)
// 		if err != nil && err != internal.ErrRecordNotFound {
// 			return res, err
// 		}
// 		audience := Audience{
// 			Name:        user.UserName,
// 			UserId:      user.Id,
// 			DisplayId:   user.DisplayId,
// 			ArmedPubKey: user.PgpProfile.PublicKey,
// 		}
// 		res = append(res, session.Session{Id: sessionId, Beta: audience})
// 	}
// 	return res, nil
// }
