package loggy

import (
	"fmt"

	"go.uber.org/zap"
)

// ---- AppErr ----
func NewAppErr(Reason string) *AppLog {
	newLog := &AppLog{
		Type:   TypeError,
		Reason: Reason,
	}
	return newLog
}

func NewAppErrF(fromat string, a ...any) *AppLog {
	return NewAppErr(fmt.Sprintf(fromat, a...))
}

// ---- AppWarning ----
func NewAppWarning(message string) *AppLog {
	newLog := &AppLog{
		Type:   TypeWarning,
		Reason: message,
	}
	return newLog
}

func NewAppWarningf(fromat string, a ...any) *AppLog {
	return NewAppWarning(fmt.Sprintf(fromat, a...))
}

// ---- AppInfo ----
func NewAppInfo(Reason string) *AppLog {
	newLog := &AppLog{
		Type:   TypeInfo,
		Reason: Reason,
	}
	return newLog
}

func NewAppInfof(fromat string, a ...any) *AppLog {
	return NewAppInfo(fmt.Sprintf(fromat, a...))
}

// ---- Set methods ----
func (l *AppLog) SetReason(reason string) *AppLog {
	if l == nil {
		return nil
	}
	l.Reason = reason
	return l
}

func (l *AppLog) SetMessage(message string) *AppLog {
	if l == nil {
		return nil
	}
	l.Message = message
	return l
}

func (l *AppLog) SetMessagef(fromat string, a ...any) *AppLog {
	if l == nil {
		return nil
	}
	l.Message = fmt.Sprintf(fromat, a...)
	return l
}

func (l *AppLog) SetErr(err error) *AppLog {
	if l == nil {
		return nil
	}
	if err != nil {
		l.Err = err
	}
	return l
}
func (l *AppLog) SetInfo(info string) *AppLog {
	if l == nil {
		return nil
	}
	l.Info = info
	return l
}
func (l *AppLog) SetParams(params map[string]string) *AppLog {
	if l == nil {
		return nil
	}
	l.Params = params
	return l
}

func (l *AppLog) AddParam(key, value string) *AppLog {
	if l == nil {
		return nil
	}
	if l.Params == nil {
		l.Params = make(map[string]string)
	}
	l.Params[key] = value
	return l
}


// ---- loggers -----

func (l *AppLog) LogWith(logger *zap.Logger) {
	if l == nil {
		return
	}
	fields := []zap.Field{
		zap.Inline(l),
	}

	switch l.Type {
	case TypeError:
		logger.Error(l.Message, fields...)
	case TypeWarning:
		logger.Warn(l.Message, fields...)
	case TypeInfo:
		logger.Info(l.Message, fields...)
	}
}

func (l *AppLog) Panic() {
	if l == nil {
		return
	}
	fields := []zap.Field{
		zap.Inline(l),
	}
	DefaultZapLogger.Panic(l.Message, fields...)
}

func (l *AppLog) PanicWith(logger *zap.Logger) {
	if l == nil {
		return
	}
	fields := []zap.Field{
		zap.Inline(l),
	}
	logger.Panic(l.Message, fields...)
}

func (l *AppLog) Fatal() {
	if l == nil {
		return
	}
	fields := []zap.Field{
		zap.Inline(l),
	}
	DefaultZapLogger.Fatal(l.Message, fields...)
}

func (l *AppLog) FatalWith(logger *zap.Logger) {
	if l == nil {
		return
	}
	fields := []zap.Field{
		zap.Inline(l),
	}
	logger.Fatal(l.Message, fields...)
}
