package loggy

import (
	"os"
	"time"

	"charm.land/log/v2"
)

var DefaultLogger = log.NewWithOptions(os.Stderr, log.Options{
	ReportCaller:    true,
	ReportTimestamp: true,
	TimeFormat:      time.Kitchen,
	Prefix: "Marble",
})
