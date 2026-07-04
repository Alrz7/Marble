migrateUpAll:
		migrate -path=./db/migrations -database=$MARBLE_DB_DSN up
	
migrateUp1:
		migrate -path=./db/migrations -database=$MARBLE_DB_DSN up 1

migrateDownAll:
		migrate -path=./db/migrations -database=$MARBLE_DB_DSN down

migrateDown1:
		migrate -path=./db/migrations -database=$MARBLE_DB_DSN down 1