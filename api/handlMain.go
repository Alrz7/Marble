package api

import (
	"marble/app/user"
	"net/http"
)

// Accounts----------------------

func (api *api) hndlAccount(w http.ResponseWriter, r *http.Request) {
	order := r.Header.Get("task")
	switch order {
	case "create":
		api.createAccount(w, r)
	}
}

func (api *api) createAccount(w http.ResponseWriter, r *http.Request) {
	var props struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Password string `json:"passsword"`
	}
	err := api.readJson(w, r, &props)
	if err != nil {
		api.badRequestResponse(w, r, err)
		return
	}
	_, prvIdentityKey, err := user.CreateNewUser(props.Name, props.Email, props.Password)
	if err != nil {
		api.serverErrorResponse(w, r, err)
	}
	response := envelope{"message": "user has been Created Succesfully!", "identity_key": prvIdentityKey}
	err = api.writeJSON(w, 200, response, nil)
	if err != nil {
		api.serverErrorResponse(w, r, err)
	}
}

// Sessions----------------------

func (api *api) hndlSession(w http.ResponseWriter, r *http.Request) {
	order := r.Header.Get("task")
	switch order {
	case "create":

	}
}

func (api *api) createSession(w http.ResponseWriter, r *http.Request) {
	var entry struct {
		Beta    string `json:"beta"`
		Message string `json:"message"`
	}
	err := api.readJson(w, r, &entry)
	if err != nil {
		api.badRequestResponse(w, r, err)
		return
	}
	TempActiverUser := user.ActiveUser{}
	err = TempActiverUser.CreateSession(entry.Beta, entry.Message)
}

// Tasks----------------------

// func (api *api) CreateProidingTask(w http.ResponseWriter, r *http.Request) {
// 	var newtask struct {
// 		Name     string          `json:"name"`
// 		Provider string          `json:"provider"`
// 		Duration cycles.Duration `json:"duration"`
// 	}
// 	err := api.readJson(w, r, &newtask)
// 	if err != nil {
// 		fmt.Println(err)
// 		Api.badRequestResponse(w, r, err)
// 		return
// 	}
// 	err = cycles.CreateProidingTask(newtask.Name, newtask.Provider, newtask.Duration)
// 	if err != nil {
// 		Api.serverErrorResponse(w, r, err)
// 		return
// 	}
// 	err = ApiConfig.Save() //-- Note that this is a temprorry Aproach. it will get removed after adding (cancle save) buttons in UI.
// 	Logger.Error(err, "")
// 	api.returnTasks(w, r)

// }
// func (api *api) hndlTasks(w http.ResponseWriter, r *http.Request) {
// 	order := r.Header.Get("order")
// 	taskType := r.Header.Get("taskType")
// 	switch order {
// 	case "create":
// 		if taskType == "providing" {
// 			api.CreateProidingTask(w, r)
// 		}
// 	}
// }

// func (api *api) returnTasks(w http.ResponseWriter, r *http.Request) {
// 	tasks := cycles.LstProvidingTasks
// 	dt := envelope{"tasks": tasks}
// 	err := api.writeJSON(w, 200, dt, nil)
// 	if err != nil {
// 		Api.serverErrorResponse(w, r, err)
// 	}
// }

// // Cycles---------------------------
// func (api *api) hndlCycles(w http.ResponseWriter, r *http.Request) {
// 	order := r.Header.Get("order")
// 	// taskType := r.Header.Get("taskType")
// 	switch order {
// 	case "create":
// 		// if taskType == "providing" {
// 		api.createNewCycle(w, r)
// 		// }
// 	case "order":
// 		api.NewCycleOrder(w, r)

// 	case "report":
// 		api.ReportCycle(w, r)
// 	}
// }

// func (api *api) createNewCycle(w http.ResponseWriter, r *http.Request) {
// 	var newCycle struct {
// 		Name           string   `json:"name"`
// 		ProvidingTasks []string `json:"providing_tasks"`
// 		AnalyzingTasks []string `json:"analyzing_tasks"`
// 	}
// 	err := api.readJson(w, r, &newCycle)
// 	if err != nil {
// 		Api.badRequestResponse(w, r, err)
// 		return
// 	}
// 	err = cycles.CreateCylce(newCycle.Name, newCycle.ProvidingTasks, newCycle.AnalyzingTasks)
// 	if err != nil {
// 		Api.serverErrorResponse(w, r, err)
// 		return
// 	}
// 	// res := envelope{
// 	// 	"message": "Task has been Created Successfully!",

// 	// }
// 	// api.writeJSON(w, 200, res, nil)

// 	err = ApiConfig.Save() //-- Note that this is a temprorry Aproach. it will get removed after adding (cancle save) buttons in UI.
// 	Logger.Error(err, "")
// 	api.returnCycles(w, r)

// }

// func (api *api) NewCycleOrder(w http.ResponseWriter, r *http.Request) {
// 	var newOrder struct {
// 		Cycle string `json:"cycle"`
// 		Order byte   `json:"order"`
// 	}
// 	err := api.readJson(w, r, &newOrder)
// 	if err != nil {
// 		Api.badRequestResponse(w, r, err)
// 		return
// 	}
// 	Api.OrderChan <- internal.CycleOrder{Cycle: newOrder.Cycle, Order: newOrder.Order}
// 	res := envelope{
// 		"message": "Order has been set!",
// 	}
// 	api.writeJSON(w, 200, res, nil)

// }

// func (api *api) ReportCycle(w http.ResponseWriter, r *http.Request) {
// 	var reportInput struct {
// 		Name string `json:"name"`
// 	}
// 	err := api.readJson(w, r, &reportInput)
// 	if err != nil {
// 		Api.badRequestResponse(w, r, err)
// 		return
// 	}
// 	dt, err := cycles.ReportStatus(reportInput.Name)
// 	if err != nil {
// 		api.serverErrorResponse(w, r, err)
// 		return
// 	}
// 	env := envelope{
// 		"status": dt,
// 	}
// 	api.writeJSON(w, 200, env, nil)

// }

// func (api *api) returnCycles(w http.ResponseWriter, r *http.Request) {
// 	cycles := cycles.LstCycles
// 	dt := envelope{"cycles": cycles}
// 	err := api.writeJSON(w, 200, dt, nil)
// 	if err != nil {
// 		Api.serverErrorResponse(w, r, err)
// 	}

// }

// // Configs---------------------------
// func (api *api) hndlConf(w http.ResponseWriter, r *http.Request) {
// 	order := r.Header.Get("order")
// 	configType := r.Header.Get("configType")
// 	switch order {
// 	case "save":
// 		if configType == "api" {
// 			api.saveApiConf(w, r)
// 		} else {
// 			api.saveAppConf(w, r)
// 		}
// 	}
// }

// func (api *api) saveApiConf(w http.ResponseWriter, r *http.Request) {
// 	err := ApiConfig.Save()
// 	if err != nil {
// 		Api.serverErrorResponse(w, r, err)
// 	} else {
// 		res := envelope{
// 			"message": "Api Config has been saved successfully!",
// 		}
// 		api.writeJSON(w, 200, res, nil)
// 	}
// }

// func (api *api) saveAppConf(w http.ResponseWriter, r *http.Request) {
// 	err := config.AppConfig.Save()
// 	if err != nil {
// 		Api.serverErrorResponse(w, r, err)
// 	} else {
// 		res := envelope{
// 			"message": "App Config has been saved successfully!",
// 		}
// 		api.writeJSON(w, 200, res, nil)
// 	}
// }
