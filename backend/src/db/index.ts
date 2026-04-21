import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema.js"

type Database = PostgresJsDatabase<typeof schema>

let sql: ReturnType<typeof postgres> | undefined
let db: Database | undefined

export function getDb(): Database {
	const url = process.env.DATABASE_URL
	if (!url) {
		throw new Error("DATABASE_URL is not set")
	}
	if (sql && db) {
		return db
	}
	sql = postgres(url, { max: 1, prepare: false })
	db = drizzle(sql, { schema })
	return db
}

export function hasDatabaseUrl(): boolean {
	return Boolean(process.env.DATABASE_URL)
}

export { schema }
