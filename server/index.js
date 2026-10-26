import 'dotenv/config'
import crypto from 'node:crypto'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import mysql from 'mysql2/promise'
import { z } from 'zod'

const { DATABASE_URL, SITE_URL, ADMIN_TOKEN, PORT = 4000, DB_SSL } = process.env
if (!DATABASE_URL || !SITE_URL || !ADMIN_TOKEN || ADMIN_TOKEN.length < 32) {
  console.error('Missing or weak environment variables. See .env.example'); process.exit(1)
}

const db = mysql.createPool({ uri: DATABASE_URL, connectionLimit: 10, ssl: DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined })
const app = express()
app.set('trust proxy', 1)                 // correct client IPs behind the host's proxy (needed for rate limiting)
app.disable('x-powered-by')
app.use(helmet())                         // security headers
const allowed = SITE_URL.split(',').map((s) => s.trim())
app.use(cors({ origin: (o, cb) => cb(null, !o || allowed.includes(o)), methods: ['GET', 'POST', 'PATCH', 'DELETE'] }))
app.use(express.json({ limit: '10kb' }))  // small bodies only

const limiter = (max) => rateLimit({ windowMs: 15 * 60 * 1000, limit: max, standardHeaders: true, legacyHeaders: false })

// ---------- Public: submit a review (creates / reuses the user profile) ----------
const ReviewIn = z.object({
  name: z.string().trim().min(2).max(60),
  email: z.string().trim().toLowerCase().email().max(120),
  rating: z.number().int().min(1).max(5),
  text: z.string().trim().min(10).max(1000),
  consent: z.literal(true),
})
app.post('/api/reviews', limiter(5), async (req, res, next) => {
  try {
    if (req.body && req.body.website) return res.status(201).json({ ok: true })   // honeypot: silently drop bots
    const p = ReviewIn.safeParse(req.body)
    if (!p.success) return res.status(400).json({ error: 'Please check your details and tick the consent box.' })
    const { name, email, rating, text } = p.data
    const [u] = await db.execute(
      'INSERT INTO users (name, email, consent_at) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE name = VALUES(name), id = LAST_INSERT_ID(id)',
      [name, email])
    const [[c]] = await db.execute("SELECT COUNT(*) AS n FROM reviews WHERE user_id = ? AND status = 'pending'", [u.insertId])
    if (c.n >= 3) return res.status(429).json({ error: 'You already have reviews waiting for approval.' })
    await db.execute('INSERT INTO reviews (user_id, rating, body) VALUES (?, ?, ?)', [u.insertId, rating, text])
    res.status(201).json({ ok: true })
  } catch (e) { next(e) }
})

// ---------- Public: approved reviews only. Never returns emails. ----------
app.get('/api/reviews', limiter(100), async (_req, res, next) => {
  try {
    const [rows] = await db.execute(
      "SELECT u.name, r.rating, r.body, r.created_at FROM reviews r JOIN users u ON u.id = r.user_id WHERE r.status = 'approved' ORDER BY r.created_at DESC LIMIT 50")
    res.json(rows)
  } catch (e) { next(e) }
})

// ---------- Admin (Bearer token, constant-time compare) ----------
const auth = (req, res, next) => {
  const a = Buffer.from((req.get('authorization') || '').replace(/^Bearer /, '')), b = Buffer.from(ADMIN_TOKEN)
  if (a.length === b.length && crypto.timingSafeEqual(a, b)) return next()
  res.status(401).json({ error: 'Unauthorized' })
}
const Status = z.enum(['pending', 'approved', 'rejected'])
app.get('/api/admin/reviews', limiter(30), auth, async (req, res, next) => {
  try {
    const s = Status.safeParse(req.query.status || 'pending')
    if (!s.success) return res.status(400).json({ error: 'Bad status' })
    const [rows] = await db.execute(
      'SELECT r.id, r.status, r.rating, r.body, r.created_at, u.id AS user_id, u.name, u.email FROM reviews r JOIN users u ON u.id = r.user_id WHERE r.status = ? ORDER BY r.created_at DESC LIMIT 200', [s.data])
    res.json(rows)
  } catch (e) { next(e) }
})
app.patch('/api/admin/reviews/:id', limiter(30), auth, async (req, res, next) => {
  try {
    const id = z.coerce.number().int().positive().safeParse(req.params.id), s = Status.safeParse(req.body && req.body.status)
    if (!id.success || !s.success) return res.status(400).json({ error: 'Bad input' })
    await db.execute('UPDATE reviews SET status = ? WHERE id = ?', [s.data, id.data])
    res.json({ ok: true })
  } catch (e) { next(e) }
})
// Privacy: delete a profile and all of its reviews on request
app.delete('/api/admin/users/:id', limiter(30), auth, async (req, res, next) => {
  try {
    const id = z.coerce.number().int().positive().safeParse(req.params.id)
    if (!id.success) return res.status(400).json({ error: 'Bad input' })
    await db.execute('DELETE FROM users WHERE id = ?', [id.data])   // reviews go with it (ON DELETE CASCADE)
    res.json({ ok: true })
  } catch (e) { next(e) }
})

app.get('/health', (_req, res) => res.json({ ok: true }))
app.use((_req, res) => res.status(404).json({ error: 'Not found' }))
app.use((err, _req, res, _next) => {   // never leak stack traces or SQL errors to clients
  console.error(err.message)
  res.status(err.status && err.status < 500 ? err.status : 500).json({ error: err.status && err.status < 500 ? 'Bad request' : 'Server error' })
})
app.listen(PORT, () => console.log('API on :' + PORT))
