package active

import (
	"sync"
	"marble/internal"

	"github.com/gorilla/websocket"
)

// there should be a Fast & responsive In-memmory storage for adding the active users
// an active-User is typically an Online User which has previously used the api after
// the aouthentication.
// the active tempDb is going to be simple and In-memmory UNTIl i implement the main User-Auth
// and then we will switch on an official Db like Redis.

var (
	mu     sync.RWMutex
	tempDb = map[*websocket.Conn]*ActvUser{}
	userDb = map[internal.UserId]*websocket.Conn{}
)

func (AU *ActvUser) InsertAs(conn *websocket.Conn) {
	mu.Lock()
	defer mu.Unlock()
	tempDb[conn] = AU
	userDb[AU.User.Id] = conn
}

func GetUserOf(conn *websocket.Conn) (*ActvUser, error) {
	mu.RLock()
	defer mu.RUnlock()
	res, ok := tempDb[conn]
	if ok {
		return res, nil
	}
	return nil, internal.ErrRecordNotFound
}

func GetConnByUserId(userId internal.UserId) (*websocket.Conn, bool) {
	mu.RLock()
	defer mu.RUnlock()
	conn, ok := userDb[userId]
	if ok {
		return conn, true
	}
	return nil, false
}

func (AU *ActvUser) UpdateUserOf(conn *websocket.Conn) {
	mu.Lock()
	defer mu.Unlock()
	tempDb[conn] = AU
	userDb[AU.User.Id] = conn
}

func DeleteUserOf(conn *websocket.Conn) {
	mu.Lock()
	defer mu.Unlock()
	if au, ok := tempDb[conn]; ok {
		delete(userDb, au.User.Id)
	}
	delete(tempDb, conn)
}