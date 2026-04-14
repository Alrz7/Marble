package pgp

import (
	"errors"
	"fmt"
	"strconv"
	"strings"

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
	lockedKey, err := pgpCryptoRefresh.LockKey(ecKey, []byte(password)) // this guy takes so much time!
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

func GetAdress(name string, id uint32) ProfileAdress {
	return ProfileAdress(fmt.Sprintf("%s-%d", name, id))
}

func IsvalidAdress(adress string) (string, uint32, error) {
	parts := strings.Split(adress, "-")
	if len(parts) != 2 {
		return "", 0, errors.New("Adress does not contain enough parts")
	}
	name, strId := parts[0], parts[1]
	id64, err := strconv.ParseUint(strId, 10, 32)
	id := uint32(id64)
	if err != nil {
		return "", 0, fmt.Errorf("Adress Id was not valid or convertable: %v", err)
	}
	return name, id, nil
}
