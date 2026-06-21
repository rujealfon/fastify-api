import pg from 'pg'

const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
const configuredRetentionDays = Number(process.env.ACCOUNT_RETENTION_DAYS)
const retentionDays = Number.isInteger(configuredRetentionDays) && configuredRetentionDays > 0
  ? configuredRetentionDays
  : 90
await client.connect()

const { rowCount } = await client.query(
  `DELETE FROM users
   WHERE deleted_at IS NOT NULL
     AND COALESCE(purge_at, deleted_at + ($1 * INTERVAL '1 day')) <= NOW()`,
  [retentionDays],
)

console.log(`[cleanup] purged ${rowCount} user(s) past their purge_at date`)
await client.end()
