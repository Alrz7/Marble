package db

import (
	"context"
	"database/sql"
	"flag"
	"os"
	"time"

	_ "github.com/lib/pq"
)

type config struct {
	dsn          string
	MaxOpenConns int
	MaxIdleCOnns int
	MaxIdleTime  string
}

var Cfg = config{}

func (cfg *config) Setup() (*sql.DB, error) {
	flag.StringVar(&cfg.dsn, "db-dsn", os.Getenv("MARBLE_DB_DSN"), "PostgreSQL DSN")
	flag.IntVar(&cfg.MaxIdleCOnns, "db-max-open-conns", 25, "PostgreSQL max open connections")
	flag.IntVar(&cfg.MaxIdleCOnns, "db-max-idle-conns", 25, "PostgreSQL max idle connections")
	flag.StringVar(&cfg.MaxIdleTime, "db-max-idle-time", "15m", "PostgreSQL max connection idle time")
	flag.Parse()

	DB, err := cfg.OpenDB()
	if err != nil {
		return nil, err
	}
	return DB, nil
}

func (cfg *config) OpenDB() (*sql.DB, error) {
	db, err := sql.Open("postgres", cfg.dsn)
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(Cfg.MaxOpenConns)
	db.SetMaxIdleConns(cfg.MaxIdleCOnns)
	duration, err := time.ParseDuration(cfg.MaxIdleTime)
	if err != nil {
		return nil, err
	}
	db.SetConnMaxIdleTime(duration)

	ctx, cancle := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancle()

	err = db.PingContext(ctx)
	if err != nil {
		return nil, err
	}

	return db, nil
}
