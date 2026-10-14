import { readFile } from 'node:fs/promises'
import { databaseActivity } from '../server/health.mjs'
const config = JSON.parse(await readFile(new URL('../wrangler.json', import.meta.url), 'utf8'))
const result = await databaseActivity(config.vars.SUPABASE_URL, config.vars.SUPABASE_PUBLISHABLE_KEY)
if (!result.ok) throw new Error(`Supabase is unavailable: ${result.reason}. Resume the project in Supabase if paused.`)
console.log('Supabase database check passed (3 read-only queries).')
