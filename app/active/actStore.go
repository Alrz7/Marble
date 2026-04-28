package active

// import "marble/internal"

// there should be a Fast & responsive In-memmory storage for adding the active users
// an active-User is typically an Online User which has previously used the api and did
// the aouthentication.
// the active DB is going to be simple and In-memmory UNTIl i implement the main User-Aouth
// and then we will switch on a official DB like Redis.
// var db = map[int32]*ActvUser{}

// func Insert(AU *ActvUser) {
// 	db[AU.User.Id] = AU
// 	// return nil
// }

// func Get(id int32) (*ActvUser, error) {
// 	res, ok := db[id]
// 	if ok {
// 		return res, nil
// 	}
// 	return nil, internal.ErrRecordNotFound
// }

// func Update(AU *ActvUser) {
// 	db[AU.User.Id] = AU
// 	// return nil
// }

// func Delete(id int32){
// 	delete(db, id)
// 	// return nil
// }
