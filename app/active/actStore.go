package active

import (
	"marble/internal"

	"github.com/gorilla/websocket"
)

// there should be a Fast & responsive In-memmory storage for adding the active users
// an active-User is typically an Online User which has previously used the api after
// the aouthentication.
// the active DB is going to be simple and In-memmory UNTIl i implement the main User-Auth
// and then we will switch on an official DB like Redis.
var db = map[*websocket.Conn]*ActvUser{}

func (AU *ActvUser) InsertAs(conn *websocket.Conn) {
	db[conn] = AU
	// loggy.DefaultLogger.Info(fmt.Sprintf("a successful login-activation for %v", AU.User.PgpProfile.Address))
	// return nil
}

func GetUserOf(conn *websocket.Conn) (*ActvUser, error) {
	res, ok := db[conn]
	if ok {
		return res, nil
	}
	return nil, internal.ErrRecordNotFound
}

func (AU *ActvUser) UpdateUserOf(conn *websocket.Conn) {
	db[conn] = AU
	// return nil
}

func DeleteUserOf(conn *websocket.Conn) {
	delete(db, conn)
	// return nil
}
