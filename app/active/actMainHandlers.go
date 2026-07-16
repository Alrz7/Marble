package active

import (
	"encoding/json"
	"marble/db"
	"marble/internal"
	"marble/internal/loggy"
)

type envelope = internal.Envelope

func HndlSessions(req *Request) {
	tesk, ok := req.Headers["task"]
	if !ok {
		actBadRequestResponse(req.conn, loggy.Say("request is missing the `task` Header"))
	}
	switch tesk {
	case "create":
		err := HndlCreateSession(req)
		if err != nil {
			DefaultLogger.Error(err)
		}

	case "sync":
		err := HndlSyncSessions(req)
		if err != nil {
			DefaultLogger.Error(err)
		}
	}
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
	beta, err := db.AppModels.UserModel.GetByDisplayId(entry.Param)
	if err != nil {
		// DefaultLogger.Error(err)
		return
	}
	results := envelope{"results": []internal.Audience{{Name: beta.UserName,
		UserId: beta.Id, DisplayId: beta.DisplayId,
		ArmedPubKey: beta.PgpProfile.PublicKey, ProfileAvatar: ""}}}

	sendHandlerResponse(req.conn, StatusApproved, "searchUser", nil, results)
}

// --------- Message -----------

func HndlMessages(req *Request) {
	tesk, ok := req.Headers["task"]
	if !ok {
		actBadRequestResponse(req.conn, loggy.Say("request is missing the `task` Header"))
	}
	switch tesk {
	case "send":
		err := HndlSendMesage(req)
		if err != nil {
			DefaultLogger.Error(err)
		}
	case "sync":
		err := HndlSyncMessages(req)
		if err != nil {
			DefaultLogger.Error(err)
		}
	case "clear":
		err := HndlClearSyncedMessage(req)
		if err != nil {
			DefaultLogger.Error(err)
		}
	}
}
