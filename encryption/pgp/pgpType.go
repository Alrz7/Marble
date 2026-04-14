package pgp

type PgpProfile struct {
	AuthKey        string
	PubIdentityKey string
	Sesions        map[ProfileAdress]uint64
	Adress         ProfileAdress
}

type ProfileAdress string

// type Message struct{
// 	Body string
// 	Signature []byte
// }

type PgpSession struct {
	SessionId     uint64
	Alpha         ProfileAdress
	Beta          ProfileAdress
	AlphaMessages [][]byte
	BetaMessages  [][]byte
}
