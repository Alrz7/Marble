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
	case "sendSessionMessage":
		HndlSendSesseionMessage(req)
	case "createSession":
		HndlCreateSession(req)
	}
}

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

func HndlCreateSession(req *Request) {
	entry := struct {
		UserId  int    `json:"userId"`
		Content string `json:"content"`
	}{}
	err := json.Unmarshal([]byte(req.Body), &entry)
	if err != nil {
		DefaultLogger.Error(err)
	}
	err = req.user.CreateSession(internal.UserId(entry.UserId), entry.Content)
	if err != nil {
		DefaultLogger.Error(err)
	}
}

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
	beta, err := Mod.SearchOneByDisplayId(entry.Param)
	if err != nil {
		// DefaultLogger.Error(err)
		return
	}
	type foundUser struct {
		Name        string          `json:"name"`
		UserId      internal.UserId `json:"userId"`
		DisplayId   string          `json:"displayId"`
		ArmedPubKey string          `json:"armedPubKey"`
	}
	results := envelope{"results": []foundUser{{Name: beta.UserName,
		UserId: beta.Id, DisplayId: beta.DisplayId,
		ArmedPubKey: beta.PgpProfile.PubIdentityKey}}}

	b, err := json.Marshal(results)
	if err != nil {
		DefaultLogger.Error(err)
	}
	resp := Request{
		Status:  StatusApproved,
		Channel: "searchUser",
		Body:    string(b),
	}
	resp.sendRequest()
}
