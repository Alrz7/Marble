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

// func GetPgpAddress(name string, id internal.UserId) Profileaddress {
// 	// NOTE the address Validation proccess goes here same as StringToPgpAddress down below
// 	return Profileaddress(fmt.Sprintf("%s-%d", name, id))
// }

// func StringToPgpAddress(address string) Profileaddress {
// 	// NOTE the address Validation proccess goes here
// 	return Profileaddress(address)
// }

// func IsValidPair(alpha, beta *Profile) error {
// 	for _, profile := range []Profile{*alpha, *beta} {
// 		_, _, err := IsvalidAddress(string(profile.Address))
// 		if err != nil {
// 			return err
// 		}
// 	}
// 	return nil
// }

// func IsvalidAddress(address string) (string, int32, error) {
// 	parts := strings.Split(address, "-")
// 	if len(parts) != 2 {
// 		return "", 0, errors.New("address does not contain enough parts")
// 	}
// 	name, strId := parts[0], parts[1]
// 	id64, err := strconv.ParseUint(strId, 10, 32)
// 	id := int32(id64)
// 	if err != nil {
// 		return "", 0, fmt.Errorf("address Id was not valid or convertable: %v", err)
// 	}
// 	return name, id, nil
// }

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
