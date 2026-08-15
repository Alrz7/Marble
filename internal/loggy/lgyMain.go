package loggy

import (
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

var DefaultZapLogger *zap.Logger = zap.NewNop()

// func init() {
// 	DefaultZapLogger, _ = zap.NewProduction()
// }

func Init(customLogger *zap.Logger) {
	if customLogger != nil {
		DefaultZapLogger = customLogger
	}
}

func Sync() {
	_ = DefaultZapLogger.Sync()
}

func (l *AppLog) MarshalLogObject(enc zapcore.ObjectEncoder) error {
	if l == nil {
		return nil
	}
	enc.AddUint("type", uint(l.Type))
	if l.Reason != "" {
		enc.AddString("reason", l.Reason)
	}
	if l.Message != "" {
		enc.AddString("message", l.Message)
	}
	if l.Info != "" {
		enc.AddString("info", l.Info)
	}
	if len(l.Params) > 0 {
		_ = enc.AddReflected("params", l.Params)
	}
	if l.Err != nil {
		enc.AddString("error", l.Err.Error())
	}
	return nil
}

func (l *AppLog) Log() {
	if l == nil {
		return
	}
	fields := []zap.Field{
		// zap.String("reason", l.Reason),
		// zap.String("info", l.Info),
		// zap.Bool("shareable", l.Shareable),
		// zap.Any("params", l.Params),
		zap.Inline(l),
	}

	switch l.Type {
	case TypeInfo:
		DefaultZapLogger.Info(l.Message, fields...)
	case TypeWarning:
		DefaultZapLogger.Warn(l.Message, fields...)
	default:
		DefaultZapLogger.Error(l.Message, fields...)
	}
}

func Get(err error) *AppLog {
	if err == nil {
		return nil
	}
	appLog, ok := err.(*AppLog)
	if ok {
		return appLog
	} else {
		newLog := AppLog{Reason: ErrUnexpected,
			Err: err}
		return &newLog
	}
}

func EchoWithMessage(message string, err error) error {
	log := Get(err)
	if log == nil {
		return nil
	}
	return log.SetMessage(message)
}

func Echo(err error) *AppLog {
	log := Get(err)
	if log == nil {
		return nil
	}
	return log
}

func (l *AppLog) ToErr() error {
	if l == nil {
		return nil
	}
	return l
}
