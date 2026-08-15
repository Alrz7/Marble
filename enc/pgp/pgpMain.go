package pgp

import "marble/internal"

type Profile struct {
	UserId    internal.UserId
	PublicKey string
}
