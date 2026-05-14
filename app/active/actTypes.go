package active

import "github.com/gorilla/websocket"

type RequestChannel = string
type RequestStatus = uint
type RequestHeaders = map[string]string
type RequestBody = string

type Request struct {
	conn    *websocket.Conn
	Status  RequestStatus  `json:"status"`
	Channel RequestChannel `json:"channel"`
	Headers RequestHeaders `json:"headers"`
	Body    RequestBody    `json:"body"`
}
type Handeler func(*Request)

func (req *Request) ResponseWriter(env any) {
	req.conn.WriteJSON(env)
}

func (req *Request) ErrorWriter() {

}

// a request can be Implemented To comunicate with a list of Channels
// and do many things by diferent GoRoutines at the same time.
