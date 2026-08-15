package api

import (
	"crypto/rand"
	"encoding/json"
	"errors"
	"io"
	"maps"
	"marble/internal"
	"marble/internal/loggy"
	"net/http"
	"strings"
)

type envelope = internal.Envelope

func (api *ApiConfig) writeJSON(w http.ResponseWriter, status int, data envelope, headers http.Header) error {
	b, err := json.Marshal(data)
	if err != nil {
		return err
	}
	b = append(b, '\n')
	maps.Copy(w.Header(), headers)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	w.Write(b)
	return nil
}

// dst must be a pointer to the destination
func (api *ApiConfig) readJson(w http.ResponseWriter, r *http.Request, dst any) error {
	maxBytes := 1_048_576
	r.Body = http.MaxBytesReader(w, r.Body, int64(maxBytes))
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	err := dec.Decode(dst)

	if err != nil {
		var syntaxError *json.SyntaxError
		var unmarshalTypeError *json.UnmarshalTypeError
		var invalidUnmarshalError *json.InvalidUnmarshalError

		switch {
		case errors.As(err, &syntaxError):
			return loggy.NewAppErrF("body contains badly-formed JSON (at character %d)", syntaxError.Offset)

		case errors.Is(err, io.ErrUnexpectedEOF):
			return loggy.NewAppErr("body contains badly-formed JSON")

		case errors.As(err, &unmarshalTypeError):
			if unmarshalTypeError.Field != "" {
				return loggy.NewAppErrF("body contains incorrect JSON type for field %q", unmarshalTypeError.Field)
			}
			return loggy.NewAppErrF("body contains incorrect JSON type (at character %d)", unmarshalTypeError.Offset)

		case errors.Is(err, io.EOF):
			return loggy.NewAppErr("body must not be empty")

		case strings.HasPrefix(err.Error(), "json: unknown field "):
			fieldName := strings.TrimPrefix(err.Error(), "json: unknown field ")
			return loggy.NewAppErrF("body contains unknown key %s", fieldName)

		case err.Error() == "http: request body too large":
			return loggy.NewAppErrF("body must not be larger than %d bytes", maxBytes)

		case errors.As(err, &invalidUnmarshalError):
			panic(err)

		default:
			return err
		}
	}

	err = dec.Decode(&struct{}{})
	if err != io.EOF {
		return loggy.NewAppErr("body must only contain a single JSON value")
	}

	return nil
}

func (api *ApiConfig) setJwtSecret() error {
	sec := make([]byte, 256)
	_, err := rand.Read(sec)
	if err != nil {
		return err
	}
	api.JwtSecret = sec
	return nil
}
