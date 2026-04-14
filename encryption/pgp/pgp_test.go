package pgp

import (
	"fmt"
	"testing"

	"github.com/ProtonMail/gopenpgp/v3/crypto"
	"github.com/ProtonMail/gopenpgp/v3/profile"
)

func TestGenPrvKey(t *testing.T) {
	s, _ := GenPrivateKey()
	// fmt.Println(s)
	x1, _ := s.ToPublic()
	x2, _ := s.ToPublic()
	fmt.Println(x1 == x2)

}

func TestGenAuthKey(t *testing.T) {
	pgpCryptoRefresh := crypto.PGPWithProfile(profile.RFC9580())
	ecKey, err := GenPrivateKey()
	if err != nil {
		fmt.Println(err)
	}
	lockedKey, err := pgpCryptoRefresh.LockKey(ecKey, []byte("myPassword"))
	if err != nil {
		fmt.Println(err)
	}
	ArmKey, err := lockedKey.Armor()
	if err != nil {
		fmt.Println(err)
	}
	fmt.Println()
	fmt.Println(DoesUnlock(ArmKey, "myPassword"))

}

func TestSigningMessage(t *testing.T) {
	pgpCryptoRefresh := crypto.PGPWithProfile(profile.RFC9580())
	// ... See generating keys
	ecKey, err := GenPrivateKey()
	if err != nil {
		t.Log(err)
	}
	ecpubkey, err := ecKey.ToPublic()
	if err != nil {
		t.Log(err)
	}

	signingMessage := []byte("message to sign")

	signer, err := pgpCryptoRefresh.Sign().SigningKey(ecKey).Detached().New()
	if err != nil {
		t.Log(err)
	}
	signature, err := signer.Sign(signingMessage, crypto.Armor)

	verifier, err := pgpCryptoRefresh.Verify().VerificationKey(ecpubkey).New()
	if err != nil {
		t.Log(err)
	}
	verifyResult, err := verifier.VerifyDetached(signingMessage, signature, crypto.Armor)
	if err != nil {
		t.Log(err)
	}
	if sigErr := verifyResult.SignatureError(); sigErr != nil {
		// Handle sigErr
	}
	fmt.Println(string(signature))
	signer.ClearPrivateParams()

}
