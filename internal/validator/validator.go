package validator

import (
	"regexp"
)

type Validator struct {
	Errors map[string]string
}

var (
	EmailRX = regexp.MustCompile("^[a-zA-Z0-9.!#$%&'*+\\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$")
)

func New() *Validator {
	return &Validator{Errors: make(map[string]string)}
}

func (v *Validator) Valid() bool {
	return len(v.Errors) == 0
}

func (v *Validator) AddError(key, massage string) {
	if _, exists := v.Errors[key]; !exists {
		v.Errors[key] = massage
	}
}

func (v *Validator) Check(ok bool, key, massage string) {
	if !ok {
		v.AddError(key, massage)
	}
}

func In(value string, list ...string) bool {
	for i := range list {
		if value == list[i] {
			return true
		}
	}
	return false
}

func Matches(values []string) bool {
	uniqueValues := make(map[string]bool)

	for _, vlaue := range values {
		uniqueValues[vlaue] = true
	}
	return len(values) == len(uniqueValues)
}
