package pgp

import (
	"fmt"
	"marble/db"
	"testing"

	"github.com/ProtonMail/gopenpgp/v3/crypto"
	"github.com/ProtonMail/gopenpgp/v3/profile"
	"github.com/lib/pq"
	"marble/internal/log"
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

// -----------
func TestSdfsdf(t *testing.T) {
	fmt.Println([]byte("jkshfkgshdfgkjlhgrisegrohsergh;sghe;ghgsgdhfgdslig"))
}

func TestInsert(t *testing.T) {
	session := Session{
		Alpha: "navid-242783429023",
		Beta:  "john-72903487134091",
		// AlphaMessages: [][]byte{{}, {}},
		// BetaMessages:  [][]byte{{}, {}},
	}
	logger := log.DefultLogger
	DB, err := db.Cfg.Setup()
	logger.Error(err, "there was an error while trying to setup Database")

	defer DB.Close()
	logger.Info("database connection pool established")
	if err != nil {
		panic(err)
	}
	fmt.Println(&session.Id)
	fmt.Println(DB)
	query := `
	INSERT INTO pgp_sessions (alpha, beta)
	VALUES ($1, $2)
	RETURNING 	id`
	args := []any{session.Alpha, session.Beta}
	err = DB.QueryRow(query, args...).Scan(&session.Id)
	if err != nil {
		fmt.Println(err)
	}
	query = `
	INSERT INTO user_messages (session_id, message)
	VALUES ($1, $2)
	RETURNING 	id`
	args = []any{session.Id, pq.Array(session.AlphaMessages)}
	var MessageID int
	err = DB.QueryRow(query, args...).Scan(&MessageID)
}
