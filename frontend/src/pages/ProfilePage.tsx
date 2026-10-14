import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { registerUserApi } from '../api/auth'
import { useAuth } from '../auth/AuthContext'
import { useHomeLists } from '../homeLists/HomeListsContext'
import { useInventory } from '../inventory/InventoryContext'
import { useTheme } from '../theme/ThemeProvider'
import { useUsage } from '../usage/UsageContext'

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'TT'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export function ProfilePage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { theme, setTheme, toggleTheme } = useTheme()
  const { assets, resetInventory } = useInventory()
  const { lists, resetLists } = useHomeLists()
  const { sessions } = useUsage()
  const [loggingOut, setLoggingOut] = useState(false)

  const isAdmin = user?.role === 'Administrator'
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newFirstName, setNewFirstName] = useState('')
  const [newLastName, setNewLastName] = useState('')
  const [newRole, setNewRole] = useState('Technician')
  const [createMsg, setCreateMsg] = useState<string | null>(null)
  const [createErr, setCreateErr] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  async function onLogout() {
    setLoggingOut(true)
    try {
      await logout()
      navigate('/login', { replace: true })
    } finally {
      setLoggingOut(false)
    }
  }

  async function onCreateUser(e: FormEvent) {
    e.preventDefault()
    setCreateMsg(null)
    setCreateErr(null)
    setCreating(true)
    try {
      const created = await registerUserApi({
        username: newUsername.trim(),
        password: newPassword,
        email: newEmail.trim(),
        firstName: newFirstName.trim(),
        lastName: newLastName.trim(),
        role: newRole,
      })
      setCreateMsg(`Usuario creado: ${created.username} (${created.role})`)
      setNewUsername('')
      setNewPassword('')
      setNewEmail('')
      setNewFirstName('')
      setNewLastName('')
      setNewRole('Technician')
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } }
      setCreateErr(axiosErr.response?.data?.error ?? 'No se pudo crear el usuario.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="px-4 pb-4 pt-3 md:px-8 md:pt-5">
      <p className="bank-section-title">Preferencias</p>
      <h1 className="mt-1 font-display text-2xl font-bold tracking-[-0.03em] md:text-[2rem]">
        Cuenta
      </h1>

      <section className="bank-card mt-5 p-4">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center border border-line bg-ledger font-display text-sm font-extrabold tracking-[0.06em]">
            {initials(user?.fullName ?? user?.username ?? 'TT')}
          </span>
          <div className="min-w-0">
            <p className="truncate font-display font-bold tracking-[-0.02em]">
              {user?.fullName ?? 'Usuario'}
            </p>
            <p className="truncate text-sm text-mute">
              {user?.role ?? '—'} · @{user?.username} · CTP Santa Eulalia
            </p>
          </div>
        </div>
        <button
          type="button"
          className="btn-secondary mt-4"
          onClick={() => void onLogout()}
          disabled={loggingOut}
        >
          {loggingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
        </button>
      </section>

      {isAdmin ? (
        <section className="bank-card mt-3 p-4">
          <h2 className="font-display text-base font-bold">Crear usuario</h2>
          <p className="mt-1 text-sm text-mute">Solo administradores. La contraseña se guarda hasheada.</p>
          <form onSubmit={onCreateUser} className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold uppercase tracking-[0.08em] text-mute">
              Usuario
              <input
                className="mt-1 w-full border border-line bg-stage px-3 py-2 text-foam outline-none focus:border-signal"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                required
                minLength={3}
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-[0.08em] text-mute">
              Contraseña
              <input
                type="password"
                className="mt-1 w-full border border-line bg-stage px-3 py-2 text-foam outline-none focus:border-signal"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-[0.08em] text-mute">
              Correo
              <input
                type="email"
                className="mt-1 w-full border border-line bg-stage px-3 py-2 text-foam outline-none focus:border-signal"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-[0.08em] text-mute">
              Rol
              <select
                className="mt-1 w-full border border-line bg-stage px-3 py-2 text-foam outline-none focus:border-signal"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
              >
                <option value="Administrator">Administrator</option>
                <option value="Technician">Technician</option>
                <option value="Viewer">Viewer</option>
                <option value="Auditor">Auditor</option>
              </select>
            </label>
            <label className="text-xs font-semibold uppercase tracking-[0.08em] text-mute">
              Nombre
              <input
                className="mt-1 w-full border border-line bg-stage px-3 py-2 text-foam outline-none focus:border-signal"
                value={newFirstName}
                onChange={(e) => setNewFirstName(e.target.value)}
                required
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-[0.08em] text-mute">
              Apellidos
              <input
                className="mt-1 w-full border border-line bg-stage px-3 py-2 text-foam outline-none focus:border-signal"
                value={newLastName}
                onChange={(e) => setNewLastName(e.target.value)}
                required
              />
            </label>
            <div className="sm:col-span-2">
              <button type="submit" className="btn-signal" disabled={creating}>
                {creating ? 'Creando…' : 'Crear usuario'}
              </button>
              {createMsg ? <p className="mt-2 text-sm text-signal">{createMsg}</p> : null}
              {createErr ? (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
                  {createErr}
                </p>
              ) : null}
            </div>
          </form>
        </section>
      ) : null}

      <section className="bank-card mt-3 p-4">
        <h2 className="font-display text-base font-bold">Apariencia</h2>
        <p className="mt-1 text-sm text-mute">
          Tema actual: {theme === 'dark' ? 'Oscuro' : 'Claro'}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className={theme === 'dark' ? 'btn-signal' : 'btn-secondary'}
            onClick={() => setTheme('dark')}
          >
            Oscuro
          </button>
          <button
            type="button"
            className={theme === 'light' ? 'btn-signal' : 'btn-secondary'}
            onClick={() => setTheme('light')}
          >
            Claro
          </button>
          <button type="button" className="btn-secondary" onClick={toggleTheme}>
            Alternar
          </button>
        </div>
      </section>

      <section className="bank-card mt-3 p-4">
        <h2 className="font-display text-base font-bold">Datos locales</h2>
        <p className="mt-1 text-sm text-mute">
          {assets.length} activos · {lists.length} clases por horario · {sessions.length} sesiones
          de uso (este navegador)
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              if (
                window.confirm(
                  '¿Borrar fichas manuales y datos llenados en Activos? Los equipos detectados en Historial vuelven a aparecer sin completar.',
                )
              ) {
                resetInventory()
              }
            }}
          >
            Limpiar alias de inventario
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              if (window.confirm('¿Restablecer clases por horario (Español, Inglés, 5 pm…)?')) {
                resetLists()
              }
            }}
          >
            Restablecer clases
          </button>
        </div>
      </section>
    </div>
  )
}
