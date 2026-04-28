package loggy

import (
	"errors"
	"fmt"
	"os"
	"time"

	"charm.land/log/v2"
)

var DefaultLogger = log.NewWithOptions(os.Stderr, log.Options{
	ReportCaller:    true,
	ReportTimestamp: true,
	TimeFormat:      time.Kitchen,
	Prefix:          "Marble",
})

func Say(msg string) error {
	return errors.New(msg)
}
func Sayr(msg string, err error) error {
	return fmt.Errorf(msg+", err : %v", err)
}
