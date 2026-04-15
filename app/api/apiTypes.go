package api

import "marble/internal/log"

type apiConfig struct {
	Version string `json:"version"`
	Port    int    `json:"port"`
	Env     string `json:"env"`
	logger  *log.Logger
}
