package users

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"database/sql"
	"errors"
	"marble/internal"
	"marble/internal/loggy"
	"time"
)

type TknScope string
type TknType string

type Token struct {
	Plaintext string          `json:"token"`
	Hash      []byte          `json:"-"`
	UserID    internal.UserId `json:"-"`
	Expiry    time.Time       `json:"expiry"`
	Scope     TknScope        `json:"scope"`
	Type      TknType         `json:"type"`
}

type TokenModel struct {
	Db internal.DBTX
}

const (
	TK_Activation     = "ActivationToken"
	TK_Authentication = "AuthenticationToken"
	Tk_Temperory      = "TemproryToken"
	TK_Refresh        = "RefreshToken"
)

func (u *User) NewToken(scope TknScope, Type TknType, exp time.Duration) *Token {
	randTk := rand.Text()
	hashArr := sha256.Sum256([]byte(randTk))
	newToken := Token{
		Plaintext: randTk,
		Hash:      hashArr[:],
		UserID:    u.Id,
		Expiry:    time.Now().Add(exp),
		Scope:     scope,
		Type:      Type,
	}
	return &newToken
}

func (m TokenModel) Insert(ctx context.Context, token *Token) error {
	if token == nil {
		return loggy.NewAppErr(loggy.ErrNoRecord)
	}

	query := `
		INSERT INTO tokens (hash, user_id, expiry, scope, type)
		VALUES ($1, $2, $3, $4, $5)`

	args := []any{
		token.Hash,
		token.UserID,
		token.Expiry,
		token.Scope,
		token.Type,
	}

	_, err := m.Db.ExecContext(ctx, query, args...)
	if err != nil {
		pqError, ok := loggy.ParsePqError(err)
		if ok {
			if errors.Is(err, context.Canceled) || errors.Is(err, context.DeadlineExceeded) {
				return loggy.NewAppErr(pqError).
					SetMessage("error while inserting token").
					SetErr(err).
					SetReason(ctx.Err().Error())
			}

			return loggy.NewAppErr(pqError).
				SetMessage("error while inserting token").
				SetErr(err)
		}

		return loggy.EchoWithMessage("error while inserting token", err)
	}

	return nil
}

func (m TokenModel) DeleteAllForUser(
	ctx context.Context,
	scope TknScope,
	userID internal.UserId,
) error {
	query := `
		DELETE FROM tokens
		WHERE scope = $1 AND user_id = $2`

	_, err := m.Db.ExecContext(ctx, query, scope, userID)
	if err != nil {
		pqError, ok := loggy.ParsePqError(err)
		if ok {
			if errors.Is(err, context.Canceled) || errors.Is(err, context.DeadlineExceeded) {
				return loggy.NewAppErr(pqError).
					SetMessage("error while deleting user tokens").
					SetErr(err).
					SetReason(ctx.Err().Error())
			}

			return loggy.NewAppErr(pqError).
				SetMessage("error while deleting user tokens").
				SetErr(err)
		}

		return loggy.EchoWithMessage("error while deleting user tokens", err)
	}

	return nil
}

func (m UserModel) GetForToken(
	ctx context.Context,
	tokenScope TknScope,
	tokenPlaintext string,
) (*User, error) {
	if tokenPlaintext == "" {
		return nil, loggy.NewAppErr(loggy.ErrNoRecord)
	}

	tokenHash := sha256.Sum256([]byte(tokenPlaintext))

	query := `
		SELECT
			u.id,
			u.email,
			u.name,
			u.display_id,
			u.session_last_seq
		FROM users u
		INNER JOIN tokens t
			ON u.id = t.user_id
		WHERE t.hash = $1
			AND t.scope = $2
			AND t.expiry > $3`

	var user User

	args := []any{
		tokenHash[:],
		tokenScope,
		time.Now(),
	}

	err := m.Db.QueryRowContext(ctx, query, args...).Scan(
		&user.Id,
		&user.Email,
		&user.UserName,
		&user.DisplayId,
		&user.SessionLastSeq,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, loggy.NewAppErr(loggy.ErrNoRecord)
		}

		pqError, ok := loggy.ParsePqError(err)
		if ok {
			if errors.Is(err, context.Canceled) || errors.Is(err, context.DeadlineExceeded) {
				return nil, loggy.NewAppErr(pqError).
					SetMessage("error while fetching user by token").
					SetErr(err).
					SetReason(ctx.Err().Error())
			}

			return nil, loggy.NewAppErr(pqError).
				SetMessage("error while fetching user by token").
				SetErr(err)
		}

		return nil, loggy.EchoWithMessage(
			"error while fetching user by token",
			err,
		)
	}

	return &user, nil
}
