package api

type api struct {
	Version string `json:"version"`
	Port    int    `json:"port"`
	Env     string `json:"env"`
}
