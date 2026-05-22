package active

import (
	"marble/internal"

	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/websocket"
)

type RequestChannel = string
type RequestStatus = int
type RequestHeaders = map[string]string
type RequestBody = string

type Request struct {
	conn    *websocket.Conn
	user    *ActvUser
	Status  RequestStatus  `json:"status"`
	Token   string         `json:"token"`
	Channel RequestChannel `json:"channel"`
	Headers RequestHeaders `json:"headers"`
	Message string         `json:"message"`
	Body    RequestBody    `json:"body"`
}

type Handeler func(*Request)

type Claims struct {
	UserId internal.UserId `json:"userId"`
	jwt.RegisteredClaims
}

func (req *Request) ResponseWriter(env any) {
	req.conn.WriteJSON(env)
}

func (req *Request) ErrorWriter() {

}

// a request can be Implemented To comunicate with a list of Channels
// and do many things by diferent GoRoutines at the same time.
