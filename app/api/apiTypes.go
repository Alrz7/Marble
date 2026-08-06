package api

import (
	"charm.land/log/v2"
)

type apiConfig struct {
	Version   string `json:"version"`
	Port      int    `json:"port"`
	Env       string `json:"env"`
	logger    *log.Logger
	JwtSecret []byte `json:"jwtSecret"`
}
