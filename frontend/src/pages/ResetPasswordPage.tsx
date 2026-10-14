import { type FormEvent, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { resetPasswordApi } from '../api/auth'
import { BrandMark } from '../components/brand/BrandMark'

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = useMemo(() => params.get('token')?.trim() ?? '', [params])

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!token) {
      setError('Falta el token del enlace. Pedí un nuevo correo de recuperación.')
      return
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setSubmitting(true)
    try {
      await resetPasswordApi(token, password)
      navigate('/login', { replace: true, state: { resetOk: true } })
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } }
      setError(axiosErr.response?.data?.error ?? 'No se pudo restablecer la contraseña.')
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
            'radial-gradient(900px 420px at 12% 0%, color-mix(in srgb, var(--tt-signal) 14%, transparent), transparent 55%)',
        }}
        aria-hidden
      />

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <BrandMark size="md" />
          <p className="mt-4 font-display text-2xl font-extrabold tracking-[-0.04em]">TechTrack</p>
        </div>

        <form onSubmit={onSubmit} className="bank-card p-5 md:p-6">
          <h1 className="font-display text-xl font-bold tracking-[-0.03em]">Nueva contraseña</h1>
          <p className="mt-1 text-sm text-mute">Elegí una contraseña nueva para tu cuenta.</p>

          {!token ? (
            <p className="mt-4 text-sm text-red-600 dark:text-red-400" role="alert">
              Enlace incompleto. Volvé a solicitar la recuperación.
            </p>
          ) : null}

          <label className="mt-5 block text-xs font-semibold uppercase tracking-[0.08em] text-mute">
            Nueva contraseña
            <input
              type="password"
              className="mt-2 w-full border border-line bg-stage px-3 py-2.5 text-foam outline-none focus:border-signal"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </label>

          <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.08em] text-mute">
            Confirmar
            <input
              type="password"
              className="mt-2 w-full border border-line bg-stage px-3 py-2.5 text-foam outline-none focus:border-signal"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={8}
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
            disabled={submitting || !token}
          >
            {submitting ? 'Guardando…' : 'Guardar contraseña'}
          </button>

          <p className="mt-4 text-center text-sm">
            <Link to="/login" className="text-signal underline-offset-2 hover:underline">
              Volver al inicio de sesión
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
