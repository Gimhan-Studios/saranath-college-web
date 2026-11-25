import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, ApiError, setCsrf } from '../lib/api'

export interface Me { id: number; username: string; full_name: string; role: 'superadmin' | 'editor'; totp_enabled: boolean; must_change_password: boolean; csrf_token: string }

interface Ctx { me: Me | null; loading: boolean; setMe: (m: Me | null) => void; refresh: () => Promise<void>; logout: () => Promise<void> }
const AuthCtx = createContext<Ctx>(null as unknown as Ctx)
export const useAuth = () => useContext(AuthCtx)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMeState] = useState<Me | null>(null)
  const [loading, setLoading] = useState(true)
  const setMe = useCallback((m: Me | null) => { setMeState(m); setCsrf(m?.csrf_token ?? '') }, [])

  const refresh = useCallback(async () => {
    try { setMe(await api<Me>('/api/auth/me')) } catch (e) { if (e instanceof ApiError && e.status === 401) setMe(null) } finally { setLoading(false) }
  }, [setMe])

  const logout = useCallback(async () => {
    try { await api('/api/auth/logout', { method: 'POST' }) } catch { /* already gone */ }
    setMe(null)
  }, [setMe])

  useEffect(() => { refresh() }, [refresh])

  // Session check every 2 minutes so an expired session sends the user to sign-in.
  useEffect(() => {
    if (!me) return
    const t = setInterval(refresh, 120_000)
    return () => clearInterval(t)
  }, [me, refresh])

  return <AuthCtx.Provider value={{ me, loading, setMe, refresh, logout }}>{children}</AuthCtx.Provider>
}
