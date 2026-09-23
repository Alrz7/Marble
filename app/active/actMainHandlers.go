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
	users, err := db.AppModels.UserModel.PrefixMatchDisplayId(subctx, entry.Param)
	if err != nil {
		appErr := loggy.Get(err)
		switch appErr.Reason {
		case loggy.ErrNoRecord:
		default:
			actErrorResponse(req.conn, appErr.Reason, appErr.Message)
			return
		}
	}
	if users == nil {
		return
	}
	var res []internal.Audience
	for _, user := range users {
		aud := internal.Audience{Name: user.UserName,
			UserId: user.Id, DisplayId: user.DisplayId,
			ArmedPubKey: user.PgpProfile.PublicKey, ProfileAvatar: user.ProfileAvatar}
		res = append(res, aud)
	}
	results := envelope{"results": res}

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
