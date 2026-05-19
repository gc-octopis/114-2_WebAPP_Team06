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

function makeToken() {
  // simple random token; acceptable for local dev
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

async function createSession(user: any) {
  const token = makeToken()
  const key = `myntupp:session:${token}`
  await redis.set(key, JSON.stringify(user))
  await redis.expire(key, 60 * 60 * 24 * 7) // 7 days
  return token
}

// Helper user storage in Redis for demo purposes
async function getUserByEmail(email: string) {
  const key = `myntupp:user:${email.toLowerCase()}`
  const v = await redis.get(key)
  if (!v) return null
  try { return JSON.parse(v) } catch { return null }
}
async function saveUser(user: any) {
  const key = `myntupp:user:${user.email.toLowerCase()}`
  await redis.set(key, JSON.stringify(user))
}

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

// Minimal register endpoint for local/dev use
auth.post('/register/', async (c) => {
  try {
    const body = await c.req.json()
    const { email, password, name } = body
    if (!email || !password) return c.json({ error: 'Missing email or password' }, 400)
    const existing = await getUserByEmail(email)
    if (existing) return c.json({ error: 'User already exists' }, 400)
    const defaultName = (email.split('@')[0] || 'Anonymous')
    const user = { id: email.toLowerCase(), email: email.toLowerCase(), name: name?.trim() || defaultName, password }
    await saveUser(user)
    const token = await createSession({ id: user.id, email: user.email, name: user.name })
    c.header('Set-Cookie', `myntupp_session=${token}; HttpOnly; Path=/; SameSite=Lax`)
    return c.json({ id: user.id, email: user.email, name: user.name })
  } catch (err) {
    console.error('register error', err && err.stack ? err.stack : err)
    return c.json({ error: 'Internal' }, 500)
  }
})

// Minimal login endpoint for local/dev use
auth.post('/login/', async (c) => {
  try {
    const body = await c.req.json()
    const { email, password } = body
    if (!email || !password) return c.json({ error: 'Missing email or password' }, 400)
    const user = await getUserByEmail(email)
    if (!user || user.password !== password) return c.json({ error: 'Invalid credentials' }, 401)
    const token = await createSession({ id: user.id, email: user.email, name: user.name })
    c.header('Set-Cookie', `myntupp_session=${token}; HttpOnly; Path=/; SameSite=Lax`)
    return c.json({ id: user.id, email: user.email, name: user.name })
  } catch (err) {
    console.error('login error', err && err.stack ? err.stack : err)
    return c.json({ error: 'Internal' }, 500)
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

// Allow updating profile (nickname)
auth.patch('/profile/', async (c) => {
  try {
    const body = await c.req.json()
    const { name } = body

    const cookieHeader = c.req.header('cookie')
    const cookies = parseCookies(cookieHeader)
    const token = cookies['myntupp_session']
    if (!token) return c.json({ error: 'Not authenticated' }, 401)

    const key = `myntupp:session:${token}`
    const v = await redis.get(key)
    if (!v) return c.json({ error: 'Not authenticated' }, 401)

    let sessionUser
    try { sessionUser = JSON.parse(v) } catch { return c.json({ error: 'Invalid session' }, 500) }

    const user = await getUserByEmail(sessionUser.email)
    if (!user) return c.json({ error: 'User not found' }, 404)

    user.name = name?.trim() ?? user.name
    await saveUser(user)

    // update session object so /me returns updated name
    await redis.set(key, JSON.stringify({ id: user.id, email: user.email, name: user.name }))
    await redis.expire(key, 60 * 60 * 24 * 7)

    return c.json({ id: user.id, email: user.email, name: user.name })
  } catch (err) {
    console.error('profile error', err && err.stack ? err.stack : err)
    return c.json({ error: 'Internal' }, 500)
  }
})

// Backwards-compatible POST route for clients that don't send PATCH
auth.post('/profile/', async (c) => {
  try {
    const body = await c.req.json()
    const { name } = body

    const cookieHeader = c.req.header('cookie')
    const cookies = parseCookies(cookieHeader)
    const token = cookies['myntupp_session']
    if (!token) return c.json({ error: 'Not authenticated' }, 401)

    const key = `myntupp:session:${token}`
    const v = await redis.get(key)
    if (!v) return c.json({ error: 'Not authenticated' }, 401)

    let sessionUser
    try { sessionUser = JSON.parse(v) } catch { return c.json({ error: 'Invalid session' }, 500) }

    const user = await getUserByEmail(sessionUser.email)
    if (!user) return c.json({ error: 'User not found' }, 404)

    user.name = name?.trim() ?? user.name
    await saveUser(user)

    await redis.set(key, JSON.stringify({ id: user.id, email: user.email, name: user.name }), 'EX', 60 * 60 * 24 * 7)

    return c.json({ id: user.id, email: user.email, name: user.name })
  } catch (err) {
    console.error(err)
    return c.json({ error: 'Internal' }, 500)
  }
})

export { auth }
