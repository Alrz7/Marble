package api

// WARNING the Mothods down below are No Longer in USE!
// the session Handelers are Now going to be used by the active's Websocket protocol and are
// no longer managed by the net-http api directly.

// import (
// 	"errors"
// 	"fmt"
// 	"marble/app/active"
// 	"marble/encryption/pgp"
// 	"marble/internal"
// 	"net/http"
// )

// // Sessions----------------------

// func (api *apiConfig) hndlSession(w http.ResponseWriter, r *http.Request) {
// 	order := r.Header.Get("task")
// 	switch order {
// 	case "create":
// 		api.createSession(w, r)
// 	case "send":
// 		api.SendSessionMessage(w, r)
// 	case "read":
// 		api.ReadSessionMessages(w, r)
// 	case "delete":

// 	}
// }

// func (api *apiConfig) createSession(w http.ResponseWriter, r *http.Request) {
// 	var entry struct {
// 		Alpha       string `json:"alpha"`
// 		Beta        string `json:"beta"`
// 		Message     string `json:"message"`
// 	}
// 	err := api.readJson(w, r, &entry)
// 	if err != nil {
// 		api.badRequestResponse(w, r, err)
// 		return
// 	}
// 	ActvUser, err := active.GetActiveUser(pgp.StringToPgpAddress(entry.Alpha))
// 	if err != nil {
// 		api.serverErrorResponse(w, r, err)
// 		return
// 	}
// 	err = ActvUser.CreateSession(pgp.StringToPgpAddress(entry.Beta), entry.Message)
// 	if err != nil {
// 		err = fmt.Errorf("there was an error while creating the session: %v", err)
// 		api.serverErrorResponse(w, r, err)
// 		return
// 	}
// 	response := envelope{
// 		"error":   false,
// 		"message": "Session has been Created Succesfully!",
// 	}
// 	err = api.writeJSON(w, 201, response, nil)
// 	if err != nil {
// 		api.serverErrorResponse(w, r, err)
// 	}
// }

// func (api *apiConfig) SendSessionMessage(w http.ResponseWriter, r *http.Request) {
// 	var entry struct {
// 		Alpha       string `json:"alpha"`
// 		Beta        string `json:"beta"`
// 		Message     string `json:"message"`
// 	}
// 	err := api.readJson(w, r, &entry)
// 	if err != nil {
// 		api.badRequestResponse(w, r, err)
// 		return
// 	}
// 	ActvUser, err := active.GetActiveUser(pgp.StringToPgpAddress(entry.Alpha))
// 	if err != nil {
// 		api.serverErrorResponse(w, r, err)
// 		return
// 	}
// 	err = ActvUser.SendSessionMessage(pgp.StringToPgpAddress(entry.Beta), entry.Message)
// 	if err != nil {
// 		err = fmt.Errorf("there was an error while sending the message: %v", err)
// 		api.serverErrorResponse(w, r, err)
// 		return
// 	}
// 	response := envelope{
// 		"error":   false,
// 		"message": "Message has been sent Successfully!",
// 	}
// 	err = api.writeJSON(w, 200, response, nil)
// 	if err != nil {
// 		api.serverErrorResponse(w, r, err)
// 	}
// }

// func (api *apiConfig) ReadSessionMessages(w http.ResponseWriter, r *http.Request) {
// 	var entry struct {
// 		Alpha       string `json:"alpha"`
// 		Beta        string `json:"beta"`
// 		From        int    `json:"from"`
// 		Count       int    `json:"count"`
// 	}
// 	err := api.readJson(w, r, &entry)
// 	if err != nil {
// 		api.badRequestResponse(w, r, err)
// 		return
// 	}
// 	ActvUser, err := active.GetActiveUser(pgp.StringToPgpAddress(entry.Alpha))
// 	if err != nil {
// 		api.serverErrorResponse(w, r, err)
// 		return
// 	}
// 	messages, lastIndex, err := ActvUser.ReadSessionMessage(pgp.StringToPgpAddress(entry.Beta), entry.From, entry.Count)
// 	if err != nil {
// 		err = fmt.Errorf("there was an error while reading messages: %v", err)
// 		api.serverErrorResponse(w, r, err)
// 		return

// 	}
// 	response := envelope{
// 		"error":      false,
// 		"message":    "Messages has been red Successfully!",
// 		"result":     messages,
// 		"last_index": lastIndex,
// 	}
// 	err = api.writeJSON(w, 200, response, nil)
// 	if err != nil {
// 		api.serverErrorResponse(w, r, err)
// 	}
// }

// func (api *apiConfig) DeleteDession(w http.ResponseWriter, r *http.Request) {
// 	var entry struct {
// 		Alpha string `json:"alpha"`
// 		Beta string `json:"beta"`
// 	}
// 	err := api.readJson(w, r, &entry)
// 	if err != nil {
// 		api.badRequestResponse(w, r, err)
// 		return
// 	}
// 	ActvUser, err := active.GetActiveUser(pgp.StringToPgpAddress(entry.Alpha))
// 	if err != nil {
// 		api.serverErrorResponse(w, r, err)
// 		return
// 	}
// 	err = ActvUser.DeleteSession(pgp.StringToPgpAddress(entry.Beta))
// 	if err != nil {

// 		switch {
// 		case errors.Is(err, internal.ErrRecordNotFound):
// 			response := envelope{
// 				"error":   true,
// 				"message": err,
// 			}
// 			err = api.writeJSON(w, http.StatusNoContent, response, nil)
// 			if err != nil {
// 				api.serverErrorResponse(w, r, err)
// 			}
// 		default:
// 			api.serverErrorResponse(w, r, err)
// 		}
// 		return
// 	}
// 	response := envelope{
// 		"error":   false,
// 		"message": "Session has been Removed Successfully!",
// 	}
// 	err = api.writeJSON(w, 200, response, nil)
// 	if err != nil {
// 		api.serverErrorResponse(w, r, err)
// 	}
// }
