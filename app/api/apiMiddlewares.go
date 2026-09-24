package api

import (
	"net/http"
	"sync"
	"time"

	"github.com/tomasen/realip"
	"golang.org/x/time/rate"
)

// TODO: add recoverPanic middleware

//----->

type limit struct {
	limiter *rate.Limiter
	timeout time.Duration
	ticker  *time.Ticker
}

func (api ApiConfig) rateLimit(next http.Handler) http.Handler {
	if !api.Limiter.Enabled {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			next.ServeHTTP(w, r)
		})
	}

	var (
		mu *sync.RWMutex = &sync.RWMutex{}

		limitMap = make(map[string]*limit)
	)

	add := func(ip string, limit *limit) {
		mu.Lock()
		defer mu.Unlock()
		limitMap[ip] = limit
	}

	get := func(ip string) *limit {
		mu.RLock()
		defer mu.RUnlock()
		limit, ok := limitMap[ip]
		if ok {
			limit.ticker.Reset(limit.timeout)
			return limit
		}
		return nil
	}

	clean := func(ip string, ticker *time.Ticker) {
		<-ticker.C
		mu.Lock()
		defer mu.Unlock()
		delete(limitMap, ip)
	}

	//this method is for dev-Only integrations, its arc is much more accurate but for higher request counts
	//it will be unefficient and the better way is to integrate it with Redis's TTL/Expire
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := realip.FromRequest(r)
		var rLimit *limit

		rLimit = get(ip)
		if rLimit == nil {
			rLimit = &limit{
				limiter: rate.NewLimiter(rate.Limit(api.Limiter.Rps), api.Limiter.Burst),
				timeout: api.Limiter.TimeOut,
				ticker:  time.NewTicker(api.Limiter.TimeOut),
			}
			add(ip, rLimit)
			go clean(ip, rLimit.ticker)
		}

		if !rLimit.limiter.Allow() {
			api.rateLimitExceededResponse(w, r)
			return
		}
		next.ServeHTTP(w, r)
	})
}
