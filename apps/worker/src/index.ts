import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import parseRoute from './routes/parse'

export type Bindings = {
  ENVIRONMENT: string
  WEB_URL: string
  GEMINI_API_KEY: string
}

export type AppEnv = { Bindings: Bindings }

const app = new Hono<AppEnv>()

app.use('*', logger())
app.use('*', cors({
  origin: (origin, c) => {
    const webUrl = c.env?.WEB_URL ?? 'http://localhost:4200'
    const allowed = [webUrl, 'http://localhost:4200']
    return allowed.includes(origin) ? origin : null
  },
  allowMethods: ['POST', 'GET', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
}))

app.get('/health', (c) => c.json({ status: 'ok' }))
app.route('/api/parse', parseRoute)

app.onError((err, c) => {
  console.error(err)
  return c.json({ success: false, message: '伺服器發生錯誤，請稍後再試' }, 500)
})

export default app
