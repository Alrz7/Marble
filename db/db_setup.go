package db

import (
	"context"
	"database/sql"
	"flag"
	"os"
	"time"

	_ "github.com/lib/pq"
)

type dbConfig struct {
	dsn          string
	MaxOpenConns int
	MaxIdleCOnns int
	MaxIdleTime  string
}

var DefaulfConfig = dbConfig{}

func (c *dbConfig) connect() (*sql.DB, error) {
	flag.StringVar(&c.dsn, "db-dsn", os.Getenv("MARBLE_DB_DSN"), "PostgreSQL DSN")
	flag.IntVar(&c.MaxIdleCOnns, "db-max-open-conns", 25, "PostgreSQL max open connections")
	flag.IntVar(&c.MaxIdleCOnns, "db-max-idle-conns", 25, "PostgreSQL max idle connections")
	flag.StringVar(&c.MaxIdleTime, "db-max-idle-time", "15m", "PostgreSQL max connection idle time")
	flag.Parse()

	db, err := sql.Open("postgres", c.dsn)
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(c.MaxOpenConns)
	db.SetMaxIdleConns(c.MaxIdleCOnns)
	duration, err := time.ParseDuration(c.MaxIdleTime)
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
