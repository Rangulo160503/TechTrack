import { type FormEvent, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { BrandMark } from '../components/brand/BrandMark'
import { useAuth } from '../auth/AuthContext'

export function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from =
    (location.state as { from?: string } | null)?.from &&
    (location.state as { from?: string }).from !== '/login'
      ? (location.state as { from: string }).from
      : '/'

  const [loginId, setLoginId] = useState('admin')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!isLoading && isAuthenticated) {
    return <Navigate to={from} replace />
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(loginId.trim(), password)
      navigate(from, { replace: true })
    } catch {
      setError('Usuario/correo o contraseña incorrectos.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-ink px-4 py-10 text-foam">
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          background:
            'radial-gradient(900px 420px at 12% 0%, color-mix(in srgb, var(--tt-signal) 18%, transparent), transparent 55%), radial-gradient(700px 380px at 100% 100%, color-mix(in srgb, var(--tt-signal) 10%, transparent), transparent 50%)',
        }}
        aria-hidden
      />

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <BrandMark size="md" />
          <p className="mt-4 font-display text-3xl font-extrabold tracking-[-0.04em]">TechTrack</p>
          <p className="mt-2 text-sm text-mute">CTP Santa Eulalia · inventario tecnológico</p>
        </div>

        <form onSubmit={onSubmit} className="bank-card p-5 md:p-6">
          <h1 className="font-display text-xl font-bold tracking-[-0.03em]">Iniciar sesión</h1>
          <p className="mt-1 text-sm text-mute">Con usuario o correo electrónico.</p>

          <label className="mt-5 block text-xs font-semibold uppercase tracking-[0.08em] text-mute">
            Usuario o correo
            <input
              className="mt-2 w-full border border-line bg-stage px-3 py-2.5 text-foam outline-none focus:border-signal"
              autoComplete="username"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="admin o tu correo"
              required
            />
          </label>

          <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.08em] text-mute">
            Contraseña
            <input
              type="password"
              className="mt-2 w-full border border-line bg-stage px-3 py-2.5 text-foam outline-none focus:border-signal"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {error ? (
            <p className="mt-3 text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            className="btn-signal mt-5 w-full"
            disabled={submitting || isLoading}
          >
            {submitting ? 'Entrando…' : 'Entrar'}
          </button>

          <p className="mt-4 text-center text-sm">
            <Link to="/forgot-password" className="text-signal underline-offset-2 hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </p>

          <p className="mt-3 text-center text-xs text-mute">
            Admin: <span className="text-foam">admin</span> o{' '}
            <span className="text-foam">joelangulo750@outlook.com</span> /{' '}
            <span className="text-foam">Admin123!</span>
          </p>
        </form>
      </div>
    </div>
  )
}
