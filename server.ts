import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import cookieParser from 'cookie-parser'
import express, { type NextFunction, type Request, type Response } from 'express'
import adminRouter, { UPLOAD_DIR } from './server/routes/admin.ts'
import authRouter from './server/routes/auth.ts'
import publicRouter from './server/routes/public.ts'
import { seedDatabase } from './server/seed.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isProduction = process.env.NODE_ENV === 'production'
const PORT = Number(process.env.PORT) || 3000

async function startServer() {
  seedDatabase()
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })

  const app = express()
  app.set('trust proxy', 1)

  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()')
    if (req.path.startsWith('/api/admin') || req.path.startsWith('/api/auth')) {
      res.setHeader('Cache-Control', 'no-store')
      res.setHeader('X-Robots-Tag', 'noindex, nofollow')
    }
    next()
  })

  app.use(cookieParser())
  app.use(express.json({ limit: '7mb' }))

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true })
  })

  app.use('/api/public', publicRouter)
  app.use('/api/auth', authRouter)
  app.use('/api/admin', adminRouter)

  app.all('/api/*rest', (_req, res) => {
    res.status(404).json({ detail: 'Not found' })
  })

  app.use('/media', express.static(path.resolve(__dirname, 'media')))
  app.use('/uploads', express.static(UPLOAD_DIR))

  app.get('/robots.txt', (_req, res) => {
    res.type('text/plain').send('User-agent: *\nDisallow: /admin\nDisallow: /api/\n')
  })

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite')
    const vite = await createViteServer({
      configFile: path.resolve(__dirname, 'frontend/vite.config.ts'),
      root: path.resolve(__dirname, 'frontend'),
      server: { middlewareMode: true },
      appType: 'spa',
    })
    app.use(vite.middlewares)
  } else {
    const distDir = path.resolve(__dirname, 'dist')
    app.use(express.static(distDir))
    app.get('*rest', (_req, res) => {
      const indexFile = path.join(distDir, 'index.html')
      if (fs.existsSync(indexFile)) {
        res.setHeader('Cache-Control', 'no-cache')
        res.sendFile(indexFile)
      } else {
        res.status(503).type('text/plain').send('Frontend not built yet. Run `npm run build`.')
      }
    })
  }

  // Express error handler (handles multer file size limits & unexpected errors)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err && typeof err === 'object' && 'code' in err && (err as { code?: string }).code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({ detail: 'Image is larger than 6 MB.' })
      return
    }
    console.error('[Saranath] Unhandled error:', err)
    res.status(500).json({ detail: 'Something went wrong. Please try again.' })
  })

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Saranath College server listening on http://0.0.0.0:${PORT}`)
  })
}

startServer().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
