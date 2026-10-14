import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { forgotPasswordApi } from '../api/auth'
import { BrandMark } from '../components/brand/BrandMark'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setSubmitting(true)
    try {
      const result = await forgotPasswordApi(email)
      setMessage(result.message)
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { error?: string }; status?: number }
        code?: string
        message?: string
      }
      if (axiosErr.response?.data?.error) {
        setError(axiosErr.response.data.error)
      } else if (!axiosErr.response) {
        setError(
          'No hay conexión con el servidor. Abrí el link actual de PUBLIC_URL.txt (el de Cloudflare cambia al reiniciar) o usá http://127.0.0.1:5173',
        )
      } else {
        setError('No se pudo procesar la solicitud. Intentá de nuevo.')
      }
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
          <h1 className="font-display text-xl font-bold tracking-[-0.03em]">Recuperar contraseña</h1>
          <p className="mt-1 text-sm text-mute">
            Usá el correo ya registrado en tu cuenta. Si el SMTP está configurado, llega un enlace;
            si no, el administrador lo ve en el log del servidor.
          </p>

          <label className="mt-5 block text-xs font-semibold uppercase tracking-[0.08em] text-mute">
            Correo
            <input
              type="email"
              className="mt-2 w-full border border-line bg-stage px-3 py-2.5 text-foam outline-none focus:border-signal"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          {message ? <p className="mt-3 text-sm text-signal">{message}</p> : null}
          {error ? (
            <p className="mt-3 text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          ) : null}

          <button type="submit" className="btn-signal mt-5 w-full" disabled={submitting}>
            {submitting ? 'Enviando…' : 'Enviar enlace'}
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
