package active

import (
	"encoding/json"
	"fmt"
)

// 					--------- Note -----------
// all of this Handelers should cooperate under the Active authentication system
// to access to the ActiveUser & User methods and Parameters
// im not adding that parts Now but i'll develop other blocks for now and
// wrap them up later.

func HndlSessions(req *Request) {
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
	DefaultLogger.Info(entry.Param)

}
