package api

type ApiConf struct {
	Port int    `json:"port"`
	Env  string `json:"env"`
}

type Application struct {
	Version string  `json:"version"`
	Api     ApiConf `json:"api"`
}
