import { Context, Hono } from 'hono'
import Redis from 'ioredis'

const redisUrl = process.env.REDIS_URL ?? 'redis://127.0.0.1:6379/0'
const redis = new Redis(redisUrl)
redis.on('error', () => {
  // suppress noisy unhandled errors; middleware handles cache misses gracefully
})

function parseCookies(cookieHeader: string | null): Record<string,string> {
  const out: Record<string,string> = {}
  if (!cookieHeader) return out
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=')
    if (idx <= 0) continue
    const k = part.slice(0, idx).trim()
    const v = part.slice(idx+1).trim()
    out[k] = decodeURIComponent(v)
  }
  return out
}

const auth = new Hono()

auth.get('/me', async (c) => {
  // Prefer middleware-attached user
  const user = (c.req as any).user
  if (user) return c.json(user)

  // fallback: attempt redis directly
  const cookieHeader = c.req.header('cookie')
  const cookies = parseCookies(cookieHeader)
  const token = cookies['myntupp_session']
  if (!token) return c.json(null)
  try {
    const key = `myntupp:session:${token}`
    const v = await redis.get(key)
    if (!v) return c.json(null)
    try {
      return c.json(JSON.parse(v))
    } catch {
      return c.json(null)
    }
  } catch (err) {
    console.error('redis error', err)
    return c.json(null)
  }
})

auth.post('/logout', async (c) => {
  const cookieHeader = c.req.header('cookie')
  const cookies = parseCookies(cookieHeader)
  const token = cookies['myntupp_session']
  if (token) {
    try {
      await redis.del(`myntupp:session:${token}`)
    } catch (err) {
      console.error('redis delete error', err)
    }
  }

  c.header('Set-Cookie', 'myntupp_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax')
  return c.json({ ok: true })
})

export { auth }
