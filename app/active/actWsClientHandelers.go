package active

import (
	"encoding/json"
	"fmt"
	"marble/app/users"
	"marble/internal"
)

type envelope = internal.Envelope

func HndlSessions(req *Request) {
	switch req.Headers["task"] {
	// case "sendSessionMessage":
	// 	HndlSendSesseionMessage(req)
	case "create":
		HndlCreateSession(req)
	case "sync":
		HndlSyncSessions(req)
	}
}

func HndlCreateSession(req *Request) {
	entry := struct {
		UserId  int    `json:"userId"`
		Content string `json:"content"`
	}{}
	err := json.Unmarshal([]byte(req.Body), &entry)
	if err != nil {
		actBadRequestResponse(req.conn, err)
	}
	err = req.user.CreateSession(internal.UserId(entry.UserId), entry.Content)
	if err != nil {
		actServerErrorResponse(req.conn, err)
	}
}

/*
Handles `onSyncSession` requests.
*/
func HndlSyncSessions(req *Request) {
	entry := struct {
		ClientExistingSessions existingAudiences `json:"existingSesions"`
	}{}
	err := json.Unmarshal([]byte(req.Body), &entry)
	if err != nil {
		actBadRequestResponse(req.conn, err)
	}
	RemainingUsers, err := returnUnsyncedSessions(req.user.PgpProfile.Sessions, entry.ClientExistingSessions)
	if err != nil {
		actServerErrorResponse(req.conn, err)
	}
	body := envelope{"sessions": RemainingUsers}
	headers := RequestHeaders{"task": "add"}
	sendHandlerResponse(req.conn, StatusApproved, "sessions", headers, body)
}

// ----- Search -----

func HndlSearchUser(req *Request) {
	//<---NOTE--->
	// search in active storage for quick search first and if we didn't  find the user we search over the main DB
	entry := struct {
		Param string `json:"param"`
	}{}
	err := json.Unmarshal([]byte(req.Body), &entry)
	if err != nil {
		DefaultLogger.Error(err)
	}
	Mod := users.UserModel{
		DB: internal.App.Db,
	}
	beta, err := Mod.GetByDisplayId(entry.Param)
	if err != nil {
		// DefaultLogger.Error(err)
		return
	}
	results := envelope{"results": []internal.Audience{{Name: beta.UserName,
		UserId: beta.Id, DisplayId: beta.DisplayId,
		ArmedPubKey: beta.PgpProfile.PubIdentityKey}}}

	sendHandlerResponse(req.conn, StatusApproved, "searchUser", nil, results)
}

// --------- Message -----------
func HndlSendSesseionMessage(req *Request) {
	entry := struct {
		SessionId uint64 `json:"session_id"`
		Message   string `json:"message"`
	}{}
	err := json.Unmarshal([]byte(req.Body), &entry)
	if err != nil {
		DefaultLogger.Error(err)
	}
	DefaultLogger.Info(fmt.Sprintf(`new Message from <%v> : %v`, req.user.UserName, entry.Message))
}
