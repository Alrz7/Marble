package loggy

import (
	"go.uber.org/zap"
)

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
