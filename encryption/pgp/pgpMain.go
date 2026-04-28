package pgp

import (
	"errors"
	"fmt"
	"marble/internal"

	"github.com/ProtonMail/gopenpgp/v3/crypto"
	"github.com/ProtonMail/gopenpgp/v3/profile"
)

func (S *Session) Save() error {
	model := SessionModel{
		DB: internal.App.Db,
	}
	err := model.Insert(S)
	if err != nil {
		fmt.Println(err)
		return err
	}
	return nil
}

func (alpha *Profile) CreateSession(alphaPrvKey crypto.Key, beta *Profile, message string) (int64, error) {
	err := IsValidPair(alpha, beta)
	if err != nil {
		return 0, err
	}
	newSession := Session{
		Alpha: alpha.Address,
		Beta:  beta.Address,
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
	err = newSession.Save()
	if err != nil {
		return 0, err
	}
	alpha.Sessions[beta.Address] = newSession.Id
	beta.Sessions[alpha.Address] = newSession.Id
	prfMod := ProfileModel{DB: internal.App.Db}
	err = prfMod.Update(alpha)
	if err != nil {
		return 0, err
	}
	err = prfMod.Update(beta)
	if err != nil {
		return 0, err
	}
	return newSession.Id, nil
}

func (alpha *Profile) SendMessage(alphaPrvKey crypto.Key, beta *Profile, session *Session, message string) error {
	err := IsValidPair(alpha, beta)
	if err != nil {
		return err
	}
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
	if alpha.Address == session.Alpha && beta.Address == session.Beta {
		session.AlphaMessages = append(session.AlphaMessages, armMessage)
	} else if alpha.Address == session.Beta && beta.Address == session.Alpha {
		session.BetaMessages = append(session.BetaMessages, armMessage)
	} else {
		return errors.New("There was a mismatch among audience while sending message")
	}
	model := SessionModel{
		DB: internal.App.Db,
	}
	return model.Update(session)
}

func (alpha *Profile) ReadMessage(alphaPrvKey *crypto.Key, beta *Profile, session *Session, count int) (*[]string, error) {
	var Messages *[][]byte
	if alpha.Address == session.Alpha && beta.Address == session.Beta {
		Messages = &session.BetaMessages
	} else if alpha.Address == session.Beta && beta.Address == session.Alpha {
		Messages = &session.AlphaMessages
	} else {
		return nil, errors.New("There was a mismatch among audience while sending message")
	}
	pgpCryptoRefresh := crypto.PGPWithProfile(profile.RFC9580())
	decHandle, err := pgpCryptoRefresh.Decryption().
		DecryptionKey(alphaPrvKey).
		New()
	defer decHandle.ClearPrivateParams()
	if err != nil {
		return nil, err
	}
	res := []string{}
	for i := 0; i < len(*Messages) && (count > 0 || count == -1); i++ {
		armMessage := (*Messages)[i]
		decrypted, err := decHandle.Decrypt(armMessage, crypto.Armor)
		if err != nil {
			return nil, err
		}
		decMessage := decrypted.Bytes()
		res = append(res, string(decMessage))
		if count != -1 {
			count--
		}
	}
	return &res, nil
}
