package internal

import (
	"errors"
)

type Duration struct {
	Week      int `json:"week"`
	Day       int `json:"day"`
	Hour      int `json:"hour"`
	Minute    int `json:"minute"`
	Second    int `json:"second"`
	InSeconds int `json:"-"`
}

func (du *Duration) DuToSeconds() (int, error) {
	out := 0
	out += du.Second
	out += du.Minute * 60
	out += du.Hour * 3600
	out += du.Day * 3600 * 24
	out += du.Week * 3600 * 24 * 7
	if out == 0 {
		return 0, errors.New("Duration you passed in for the task should Not be 0 in Total Seconds")
	}
	du.InSeconds = out
	return out, nil
}

var (
	ErrRecordNotFound = errors.New("Record Not Found")
)
