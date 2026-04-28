package users

import (
	"fmt"
	"marble/encryption/pgp"
	"testing"
)

func TestCreateUser(t *testing.T) {
	usr1, usrprv1, err := CreateNewUser("navid", "nv@gmail.com", "navid123")
	if err != nil {
		t.Log(err)
	}
	usr2, usrprv2, err := CreateNewUser("nick", "nc@gmail.com", "nick456")
	if err != nil {
		t.Log(err)
	}
	sId, err := usr1.PgpProfile.CreateSession(*usrprv1, &usr2.PgpProfile, "starting the session")
	if err != nil {
		t.Log(err)
	}
	err = usr1.PgpProfile.SendMessage(*usrprv1, &usr2.PgpProfile, pgp.TestingFindSession(sId), "hi, this is a program testing message")
	if err != nil {
		t.Log(err)
	}
	mslist, err := usr2.PgpProfile.ReadMessage(*usrprv2, &usr1.PgpProfile, pgp.TestingFindSession(sId), -1)
	if err != nil {
		t.Log(err)
	}
	fmt.Println(mslist)

}
