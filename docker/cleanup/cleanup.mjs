import pg from 'pg'

const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
await client.connect()

const { rowCount } = await client.query(
  `DELETE FROM users WHERE purge_at IS NOT NULL AND purge_at <= NOW()`,
)

console.log(`[cleanup] purged ${rowCount} user(s) past their purge_at date`)
await client.end()
