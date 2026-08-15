package pgp

import (
	"encoding/json"
	"marble/internal"

	"github.com/ProtonMail/gopenpgp/v3/constants"
	"github.com/ProtonMail/gopenpgp/v3/crypto"
	"github.com/ProtonMail/gopenpgp/v3/profile"
)

func GenPrivateKey() (*crypto.Key, error) {
	pgpCryptoRefresh := crypto.PGPWithProfile(profile.RFC9580())

	keyGenHandle := pgpCryptoRefresh.KeyGeneration().New()
	ecKey, err := keyGenHandle.GenerateKeyWithSecurity(constants.HighSecurity)
	if err != nil {
		return nil, err
	}
	return ecKey, nil
}

func GenAuthKey(password string) (string, error) {
	pgpCryptoRefresh := crypto.PGPWithProfile(profile.RFC9580())
	ecKey, err := GenPrivateKey()
	if err != nil {
		return "", err
	}
	lockedKey, err := pgpCryptoRefresh.LockKey(ecKey, []byte(password)) // <-- this guy takes so much time!
	if err != nil {
		return "", err
	}
	ArmKey, err := lockedKey.Armor()
	if err != nil {
		return "", err
	}
	return ArmKey, nil
}

func DoesUnlock(privKey, password string) (bool, error) {
	lockedKey, err := crypto.NewKeyFromArmored(privKey)
	if err != nil {
		return false, err
	}
	_, err = lockedKey.Unlock([]byte(password))
	if err != nil {
		return false, err
	}
	return true, nil
}

func GetKeyfromArmored(key string) (*crypto.Key, error) {
	return crypto.NewKeyFromArmored(key)
}

func getProfileSessionsFromMarshaled(b []byte) (map[internal.UserId]int64, error) {
	var sessions = map[internal.UserId]int64{}
	err := json.Unmarshal(b, &sessions)
	if err != nil {
		return nil, err
	}
	return sessions, nil
}
