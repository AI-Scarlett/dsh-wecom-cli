export const ROUTE = '/api2/dsh-wecom-cli/setup'
const MAX_BODY = 4096

function header(req, name) { const value = req?.headers?.[name]; return Array.isArray(value) ? value[0] : value }
function send(res, status, payload) { res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); res.end(JSON.stringify(payload)) }

async function body(req) {
  const chunks = []; let size = 0
  for await (const chunk of req) { size += chunk.length; if (size > MAX_BODY) throw Object.assign(new Error('request too large'), { code: 'REQUEST_TOO_LARGE' }); chunks.push(chunk) }
  if (!chunks.length) return {}
  const value = JSON.parse(Buffer.concat(chunks).toString('utf8'))
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('JSON object required')
  return value
}

export async function handleSetup(req, res, onboarding) {
  try {
    if (req.method !== 'POST') return send(res, 405, { ok: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'POST required' } })
    const host = header(req, 'host'); const origin = header(req, 'origin')
    if (origin && new URL(origin).host !== host) throw Object.assign(new Error('cross-origin request denied'), { code: 'CROSS_ORIGIN' })
    const input = await body(req); const action = input.action ?? 'status'
    let value
    if (action === 'status') value = await onboarding.status()
    else if (action === 'install') {
      if (header(req, 'x-dsh-wecom-intent') !== 'install') throw Object.assign(new Error('installation intent required'), { code: 'INTENT_REQUIRED' })
      value = await onboarding.startInstall(input.confirmation)
    } else if (action === 'cancel-install') {
      if (header(req, 'x-dsh-wecom-intent') !== 'cancel-install') throw Object.assign(new Error('cancel installation intent required'), { code: 'INTENT_REQUIRED' })
      value = await onboarding.cancelInstall()
    }
    else if (action === 'authorize') {
      if (header(req, 'x-dsh-wecom-intent') !== 'authorize') throw Object.assign(new Error('authorization intent required'), { code: 'INTENT_REQUIRED' })
      value = await onboarding.startAuthorization(input.confirmation)
    } else if (action === 'cancel') {
      if (header(req, 'x-dsh-wecom-intent') !== 'cancel') throw Object.assign(new Error('cancel intent required'), { code: 'INTENT_REQUIRED' })
      value = await onboarding.cancelAuthorization()
    } else if (action === 'test') value = await onboarding.testConnection()
    else throw Object.assign(new Error('unknown setup action'), { code: 'UNKNOWN_ACTION' })
    send(res, 200, { ok: true, value })
  } catch (error) {
    send(res, 409, { ok: false, error: { code: error?.code ?? 'SETUP_FAILED', message: String(error?.message || error) } })
  }
}

export function registerSetupRoute(webServer, onboarding) {
  return webServer.register({ kind: 'exact', path: ROUTE, handler: (req, res) => handleSetup(req, res, onboarding) })
}
