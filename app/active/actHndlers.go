package active

import (
	"encoding/json"
)

func HndlSessions(req *Request) {
	entry := struct {
		SessionId uint64 `json:"session_id"`
		Message   string `json:"message"`
	}{}
	err := json.Unmarshal([]byte(req.Body), &entry)
	if err != nil {
		DefaultLogger.Error(err)
	}
	DefaultLogger.Info(entry.Message)
}

