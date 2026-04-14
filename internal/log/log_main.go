package log

import (
	"fmt"
	"log"
	"os"
	"runtime/debug"
)

var (
	DefultInfoLog  = log.New(os.Stdout, "INFO\t", log.Ldate|log.Ltime)
	DefultErrorLog = log.New(os.Stderr, "ERROR\t", log.Ldate|log.Ltime|log.Lshortfile)
)

type Logger struct {
	ErrorLogger *log.Logger
	InfoLogger  *log.Logger
}

var DefultLogger = Logger{
	ErrorLogger: DefultErrorLog,
	InfoLogger:  DefultInfoLog,
}

// create new Error based on customized logger WithOut Actually using (err error).
// It Causes the program to exit after parsing the error with os.Exit(1)
func (l *Logger) NewError(text string, a ...any) {
	txt := fmt.Sprintf(text, a...)
	trace := fmt.Sprintf("%v: %s", txt, debug.Stack())
	l.ErrorLogger.Output(2, trace)
	os.Exit(1)
}

// Its Basicly NewError() function but you Need to pass the (err error).
// NOTE that it checks the err Itself (err != nil).
func (l *Logger) Error(err error, text string, a ...any) {
	if err != nil {
		txt := fmt.Sprintf(text, a...)
		trace := fmt.Sprintf("%v: %s\n%s", txt, error.Error(err), debug.Stack())
		l.ErrorLogger.Output(2, trace)
		os.Exit(1)
	}
}

func (l *Logger) Info(text string) {
	l.InfoLogger.Println(text)
}
func (l *Logger) Infot(text string, a ...any) {
	txt := fmt.Sprintf(text, a...)
	l.InfoLogger.Println(txt)
}

// 	stac := trace := fmt.Sprintf("%s\n%s", err.Error(), debug.Stack())
