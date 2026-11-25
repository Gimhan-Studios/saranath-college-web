export class ApiError extends Error {
  status: number
  fields: Record<string, string>
  constructor(status: number, message: string, fields: Record<string, string> = {}) {
    super(message)
    this.status = status
    this.fields = fields
  }
}

let csrfToken = ''
export const setCsrf = (t: string) => { csrfToken = t }

export async function api<T>(path: string, opts: { method?: string; body?: unknown; form?: FormData } = {}): Promise<T> {
  const method = opts.method ?? 'GET'
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (method !== 'GET' && csrfToken) headers['X-CSRF-Token'] = csrfToken
  let body: BodyInit | undefined
  if (opts.form) body = opts.form
  else if (opts.body !== undefined) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(opts.body) }
  const res = await fetch(path, { method, headers, body, credentials: 'same-origin' })
  if (res.status === 204) return undefined as T
  let data: unknown = null
  try { data = await res.json() } catch { /* empty body */ }
  if (!res.ok) {
    const d = data as { detail?: string; errors?: { field: string; message: string }[] } | null
    const fields: Record<string, string> = {}
    d?.errors?.forEach((e) => { fields[e.field] = e.message })
    throw new ApiError(res.status, d?.detail || `Request failed (${res.status})`, fields)
  }
  return data as T
}
