import Redis from 'ioredis'
import { Context } from 'hono'

const redisUrl = process.env.REDIS_URL ?? 'redis://127.0.0.1:6379/0'
const redis = new Redis(redisUrl)
redis.on('error', (err) => {
  // avoid unhandled error events from ioredis when Redis is down
  console.warn('ioredis error (ignored):', err && err.message ? err.message : err)
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

export async function sessionMiddleware(c: Context, next: any) {
  try {
    // guard: ensure request and headers exist
    if (!c || !c.req || typeof c.req.header !== 'function') {
      return await next()
    }
    const cookieHeader = c.req.header('cookie')
    const cookies = parseCookies(cookieHeader)
    const token = cookies['myntupp_session']

    // attach default
    ;(c.req as any).user = null

    if (!token) {
      return await next()
    }

    // Try Redis first; the session payload already contains user profile data.
    try {
      const key = `myntupp:session:${token}`
      const v = await redis.get(key)
      if (v) {
        try {
          (c.req as any).user = JSON.parse(v)
        } catch {
          (c.req as any).user = null
        }
        return await next()
      }
    } catch (err) {
      console.warn('Redis error in sessionMiddleware:', err && err.message ? err.message : err)
    }

    return await next()
  } catch (err) {
    console.warn('sessionMiddleware unexpected error:', err && err.message ? err.message : err)
    ;(c.req as any).user = null
    return await next()
  }
}

export default sessionMiddleware
