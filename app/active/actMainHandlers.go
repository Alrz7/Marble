package active

import (
	"context"
	"encoding/json"
	"marble/db"
	"marble/internal"
	"marble/internal/loggy"
	"time"
)

type envelope = internal.Envelope

func HndlSessions(req *Request) {
	tesk, ok := req.Headers["task"]
	if !ok {
		actBadRequestResponse(req.conn, loggy.NewAppErr("request is missing the `task` Header"))
	}
	switch tesk {
	case "create":
		err := HndlCreateSession(req)
		if err != nil {
			loggy.Get(err).Log()
		}

	case "sync":
		err := HndlSyncSessions(req)
		if err != nil {
			loggy.Get(err).Log()
		}

	case "delete":
		err := HndlDeleteSession(req)
		if err != nil {
			loggy.Get(err).Log()
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
		loggy.Get(err).Log()
	}
	subctx, cancel := context.WithTimeout(req.ctx, time.Second*3)
	defer cancel()
	beta, err := db.AppModels.UserModel.GetByDisplayId(subctx, entry.Param)
	if err != nil {
		appErr := loggy.Get(err)
		switch appErr.Reason {
		case loggy.ErrNoRecord:
		default:
			// loggy.Get(err).Log()
		}
	}
	if beta == nil {
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
		actBadRequestResponse(req.conn, loggy.NewAppErr("request is missing the `task` Header"))
	}
	switch tesk {
	case "send":
		err := HndlSendMessage(req)
		if err != nil {
			loggy.Get(err).Log()
		}
	case "sync":
		err := HndlSyncMessages(req)
		if err != nil {
			loggy.Get(err).Log()
		}
	case "clear":
		err := HndlClearSyncedMessage(req)
		if err != nil {
			loggy.Get(err).Log()
		}
	}
}
