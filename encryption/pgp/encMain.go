package pgp

import (
	"errors"
	"math/rand"

	"github.com/ProtonMail/gopenpgp/v3/crypto"
	"github.com/ProtonMail/gopenpgp/v3/profile"
)

var InMemoryTestingSessionSave []Session

func TestingFindSession(id uint64) *Session {
	for in, it := range InMemoryTestingSessionSave {
		if it.Id == id {
			return &InMemoryTestingSessionSave[in]
		}
	}
	return &Session{}
}

func (S *Session) Save() {
	InMemoryTestingSessionSave = append(InMemoryTestingSessionSave, *S)
}

func (alpha *PgpProfile) CreateSession(alphaPrvKey crypto.Key, beta *PgpProfile, message string) (uint64, error) {
	newSession := Session{
		Alpha: alpha.Adress,
		Beta:  beta.Adress,
	}
	newSession.Id = rand.Uint64()
	for newSession.Id == 0 || false { // this should be replaced with a value checker in Db
		newSession.Id = rand.Uint64()
	}
	pgpCryptoRefresh := crypto.PGPWithProfile(profile.RFC9580())

	betaPubKey, err := crypto.NewKeyFromArmored(beta.PubIdentityKey)
	if err != nil {
		return 0, err
	}
	encHandle, err := pgpCryptoRefresh.Encryption().
		Recipient(betaPubKey).
		SigningKey(&alphaPrvKey).New()
	defer encHandle.ClearPrivateParams()
	if err != nil {
		return 0, err
	}
	pgpMessage, err := encHandle.Encrypt([]byte(message))
	armMessage, err := pgpMessage.ArmorBytes()
	newSession.AlphaMessages = append(newSession.AlphaMessages, armMessage)
	alpha.Sesions[beta.Adress] = newSession.Id
	beta.Sesions[alpha.Adress] = newSession.Id
	newSession.Save()
	return newSession.Id, nil
}

func (alpha *PgpProfile) SendMessage(alphaPrvKey crypto.Key, beta *PgpProfile, session *Session, message string) error {
	pgpCryptoRefresh := crypto.PGPWithProfile(profile.RFC9580())
	betaPubKey, err := crypto.NewKeyFromArmored(beta.PubIdentityKey)
	if err != nil {
		return err
	}
	encHandle, err := pgpCryptoRefresh.Encryption().Recipient(betaPubKey).New()
	defer encHandle.ClearPrivateParams()
	if err != nil {
		return err
	}
	pgpMessage, err := encHandle.Encrypt([]byte(message))
	if err != nil {
		return err
	}
	armMessage, err := pgpMessage.ArmorBytes()
	if err != nil {
		return err
	}
	if alpha.Adress == session.Alpha && beta.Adress == session.Beta {
		session.AlphaMessages = append(session.AlphaMessages, armMessage)
	} else if alpha.Adress == session.Beta && beta.Adress == session.Alpha {
		session.BetaMessages = append(session.BetaMessages, armMessage)
	} else {
		return errors.New("There was a mismatch among audience while sending message")
	}
	return nil
}

func (alpha *PgpProfile) ReadMessage(alphaPrvKey crypto.Key, beta *PgpProfile, session *Session, n int) ([]string, error) {
	var Messages *[][]byte
	if alpha.Adress == session.Alpha && beta.Adress == session.Beta {
		Messages = &session.BetaMessages
	} else if alpha.Adress == session.Beta && beta.Adress == session.Alpha {
		Messages = &session.AlphaMessages
	} else {
		return []string{}, errors.New("There was a mismatch among audience while sending message")
	}
	pgpCryptoRefresh := crypto.PGPWithProfile(profile.RFC9580())
	decHandle, err := pgpCryptoRefresh.Decryption().
		DecryptionKey(&alphaPrvKey).
		New()
	defer decHandle.ClearPrivateParams()
	if err != nil {
		return []string{}, err
	}
	res := []string{}
	for i := 0; i < len(*Messages) && (n > 0 || n == -1); i++ {
		armMessage := (*Messages)[i]
		decrypted, err := decHandle.Decrypt(armMessage, crypto.Armor)
		if err != nil {
			return []string{}, err
		}
		decMessage := decrypted.Bytes()
		res = append(res, string(decMessage))
		if n != -1 {
			n--
		}
	}

	return res, nil
}
