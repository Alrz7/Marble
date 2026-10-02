package helpers

import (
	"fmt"
	"marble/internal/loggy"
	"sync"
)

func DoRecover(wg *sync.WaitGroup, fn func()) {
	wg.Go(func() {
		defer func() {
			pv := recover()
			if pv != nil {
				loggy.NewAppErr("PanicRecoveryFailed").SetMessage(fmt.Sprintf("%v", pv))
			}
		}()
		fn()
	})
}
