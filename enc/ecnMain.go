package enc

import "golang.org/x/crypto/bcrypt"

func HashUserAuthKey(authKey string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(authKey), bcrypt.DefaultCost)
	return string(bytes), err
}

func CheckAuthHash(authKey, existingAuthHash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(existingAuthHash), []byte(authKey))
	return err == nil
}
