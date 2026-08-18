
export const LIMITS = Object.freeze({
  timeoutMs: 15_000,
  maxOutputBytes: 256 * 1024,
  maxInputBytes: 32 * 1024,
  maxPageCount: 3,
  maxArrayItems: 100,
  maxObjectKeys: 100,
  maxStringLength: 4096,
  maxDepth: 8,
})

const OPERATION_SPECS = Object.freeze({
  status: { argv: ['--version'], input: false },
  auth_status: { argv: ['auth', 'show', '--status'], input: false },
  identity_whoami: { argv: ['identity', 'whoami'] },
  contact_users_search: { argv: ['contact', 'users', 'search'] },
  message_sessions_list: { argv: ['message', 'aibot', 'sessions', 'list'] },
  disk_files_list: { argv: ['disk', 'files', 'list'], paged: true },
  disk_files_search: { argv: ['disk', 'files', 'search'], paged: true },
  disk_files_get: { argv: ['disk', 'files', 'get'] },
  meeting_search: { argv: ['meeting', 'search'], paged: true },
  meeting_list: { argv: ['meeting', 'list'], paged: true },
  meeting_get: { argv: ['meeting', 'get'] },
  meeting_original_get: { argv: ['meeting', 'original', 'get'] },
  meeting_rooms_buildings_list: { argv: ['meeting', 'rooms', 'buildings', 'list'] },
  meeting_rooms_search: { argv: ['meeting', 'rooms', 'search'], paged: true },
  doc_search: { argv: ['doc', 'search'], paged: true },
  doc_contents_get: { argv: ['doc', 'contents', 'get'] },
  calendar_schedules_free_list: { argv: ['calendar', 'schedules', 'free', 'list'] },
  calendar_schedules_list: { argv: ['calendar', 'schedules', 'list'], paged: true },
  calendar_schedules_get: { argv: ['calendar', 'schedules', 'get'] },
  calendar_schedules_search: { argv: ['calendar', 'schedules', 'search'], paged: true },
  smartsheet_sheets_list: { argv: ['smartsheet', 'sheets', 'list'] },
  smartsheet_records_list: { argv: ['smartsheet', 'records', 'list'], paged: true },
  smartsheet_fields_list: { argv: ['smartsheet', 'fields', 'list'], paged: true },
  smartsheet_views_list: { argv: ['smartsheet', 'views', 'list'], paged: true },
  smartsheet_charts_list: { argv: ['smartsheet', 'charts', 'list'], paged: true },
  sheet_get: { argv: ['sheet', 'get'] },
  sheet_ranges_get: { argv: ['sheet', 'ranges', 'get'] },
  mail_search: { argv: ['mail', 'search'], paged: true },
  mail_get: { argv: ['mail', 'get'] },
  smartpage_pages_get: { argv: ['smartpage', 'pages', 'get'] },
  smartpage_databases_get: { argv: ['smartpage', 'databases', 'get'] },
  todo_list: { argv: ['todo', 'list'], paged: true },
  todo_get: { argv: ['todo', 'get'] },
})

export const READ_OPERATIONS = Object.freeze(Object.keys(OPERATION_SPECS))

const SECRET_KEYS = /^(?:password|passwd|secret|token|access_token|refresh_token|authorization|cookie|webhook|webhook_url|write_key|api_key|encryption_key)$/i
const PATH_KEYS = /^(?:path|file_path|local_path|output_path|download_path|source_path|target_path)$/i
const SENSITIVE_ID_KEYS = /^(?:id|userid|open_vid|docid|cursor|[a-z0-9]+_id)$/i
const URL_KEYS = /(?:^|_)(?:url|uri|link)$/i
const ABSOLUTE_PATH = /^(?:\/|[A-Za-z]:[\\/]|\\\\)/
const URL_VALUE = /^[a-z][a-z0-9+.-]*:\/\//i
const EFFECTFUL_FORMULA = /\b(?:OPENLINK|ADDRECORD|MODIFYRECORDS)\s*\(/i
const SQL_LIKE = /\b(?:SELECT|INSERT|UPDATE|DELETE|JOIN|DROP|ALTER|CREATE)\b/i

function fail(code, message) {
  throw Object.assign(new Error(message), { code })
}

function inspectInput(value, depth = 0, key = '') {
  if (depth > LIMITS.maxDepth) fail('INPUT_TOO_DEEP', 'input nesting exceeds the configured limit')
  if (value === null || typeof value === 'boolean' || typeof value === 'number') return
  if (typeof value === 'string') {
    if (value.length > LIMITS.maxStringLength) fail('STRING_TOO_LARGE', 'input string exceeds the configured limit')
    if (value.includes('\0') || value.includes('\n') || value.includes('\r')) fail('CONTROL_CHARACTER', 'multiline or NUL input is not allowed')
    if (URL_VALUE.test(value) || URL_KEYS.test(key)) fail('URL_INPUT_BLOCKED', 'URL input is not allowed in read-only mode')
    if (ABSOLUTE_PATH.test(value) || PATH_KEYS.test(key)) fail('LOCAL_PATH_BLOCKED', 'local path input is not allowed in read-only mode')
    if (EFFECTFUL_FORMULA.test(value)) fail('EFFECTFUL_FORMULA_BLOCKED', 'effectful formulas are not allowed in read-only mode')
    if (SQL_LIKE.test(value) || key.toLowerCase() === 'sql') fail('SQL_BLOCKED', 'SQL is not allowed in the v0.3.0 read-only bridge')
    return
  }
  if (Array.isArray(value)) {
    if (value.length > LIMITS.maxArrayItems) fail('ARRAY_TOO_LARGE', 'input array exceeds the configured limit')
    for (const item of value) inspectInput(item, depth + 1, key)
    return
  }
  if (typeof value !== 'object') fail('INVALID_INPUT_TYPE', 'input contains an unsupported value')
  const entries = Object.entries(value)
  if (entries.length > LIMITS.maxObjectKeys) fail('OBJECT_TOO_LARGE', 'input object exceeds the configured limit')
  for (const [childKey, childValue] of entries) {
    if (SECRET_KEYS.test(childKey)) fail('SECRET_INPUT_BLOCKED', 'secret-like input fields are not allowed')
    if (PATH_KEYS.test(childKey)) fail('LOCAL_PATH_BLOCKED', 'local path fields are not allowed')
    inspectInput(childValue, depth + 1, childKey)
  }
}

function safeJson(input) {
  if (input === undefined) return '{}'
  if (!input || typeof input !== 'object' || Array.isArray(input)) fail('INVALID_INPUT', 'input must be a JSON object')
  inspectInput(input)
  const json = JSON.stringify(input)
  if (Buffer.byteLength(json) > LIMITS.maxInputBytes) fail('INPUT_TOO_LARGE', 'serialized input exceeds the configured byte limit')
  return json
}

function redact(value, depth = 0, key = '') {
  if (depth > LIMITS.maxDepth) return '[truncated]'
  if (value === null || typeof value === 'boolean' || typeof value === 'number') return value
  if (typeof value === 'string') {
    if (SENSITIVE_ID_KEYS.test(key)) return '[redacted-id]'
    if (SECRET_KEYS.test(key)) return '[redacted-secret]'
    if (URL_KEYS.test(key) || URL_VALUE.test(value)) return '[redacted-url]'
    if (PATH_KEYS.test(key) || ABSOLUTE_PATH.test(value)) return '[redacted-path]'
    return value.length > 2000 ? value.slice(0, 2000) + '…[truncated]' : value
  }
  if (Array.isArray(value)) return value.slice(0, 50).map((item) => redact(item, depth + 1, key))
  if (typeof value !== 'object') return '[redacted]'
  const out = {}
  for (const [childKey, childValue] of Object.entries(value).slice(0, 100)) {
    out[childKey] = redact(childValue, depth + 1, childKey)
  }
  return out
}

async function runManaged(subprocess, executable, argv, { signal, cwd }) {
  if (!subprocess || typeof subprocess.spawn !== 'function') fail('SUBPROCESS_UNAVAILABLE', 'DSH subprocess service is unavailable')
  const timeoutSignal = AbortSignal.timeout(LIMITS.timeoutMs)
  const combinedSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal
  const handle = subprocess.spawn({
    argv: [executable, ...argv],
    cwd,
    stdio: {
      stdin: 'ignore',
      stdout: { maxBytes: LIMITS.maxOutputBytes },
      stderr: { maxBytes: 16 * 1024 },
    },
    graceMs: 3_000,
    signal: combinedSignal,
  })
  const outcome = await handle.done
  await handle.waitForExit()
  const stdoutRead = handle.collected.stdout?.readFrom(0) || { text: '', lossy: false }
  const stderrRead = handle.collected.stderr?.readFrom(0) || { text: '', lossy: false }
  if (stdoutRead.lossy || stderrRead.lossy) fail('OUTPUT_TOO_LARGE', 'wecom-cli output exceeded the configured limit')
  if (timeoutSignal.aborted && !signal?.aborted) fail('CLI_TIMEOUT', 'official wecom-cli exceeded the configured timeout')
  if (signal?.aborted) fail('CLI_CANCELLED', 'official wecom-cli was cancelled')
  return { code: outcome.exitCode, signal: outcome.signal, stdout: stdoutRead.text, stderr: stderrRead.text }
}

function parseOutput(text, operation) {
  const trimmed = String(text || '').trim()
  if (operation === 'status') {
    const version = trimmed.match(/\bv?(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)\b/)?.[1]
    return { version: version || 'unknown' }
  }
  if (operation === 'auth_status') {
    const normalized = trimmed.toLowerCase()
    const status = normalized.includes('unauthorized') ? 'unauthorized' : normalized.includes('authorized') ? 'authorized' : 'unknown'
    return { status }
  }
  if (!trimmed) fail('MALFORMED_OUTPUT', 'official wecom-cli returned an empty business response')
  try { return JSON.parse(trimmed) }
  catch { fail('MALFORMED_OUTPUT', 'official wecom-cli returned malformed JSON; raw output was withheld') }
}

export function createWecomReadBridge(options = {}) {
  const subprocess = options.subprocess
  const cwd = options.cwd || process.cwd()
  const executableResolver = options.executableResolver || ((signal) => subprocess.resolveExecutable('wecom-cli', undefined, signal))
  const run = options.run || ((executable, argv, context) => runManaged(subprocess, executable, argv, { ...context, cwd }))
  return {
    async execute(args = {}, exec = {}) {
      const spec = OPERATION_SPECS[args.operation]
      if (!spec) fail('OPERATION_NOT_ALLOWED', 'operation is not in the read-only allowlist')
      const pageCount = args.pageCount === undefined ? 1 : args.pageCount
      if (!Number.isInteger(pageCount) || pageCount < 1 || pageCount > LIMITS.maxPageCount) fail('PAGE_LIMIT', 'pageCount must be an integer from 1 to 3')
      if (!spec.paged && pageCount !== 1) fail('PAGINATION_NOT_SUPPORTED', 'this operation does not support pagination')
      const argv = [...spec.argv]
      if (spec.input !== false) argv.push('--json', safeJson(args.input))
      if (spec.paged && pageCount > 1) argv.push('--page-count', String(pageCount))
      const executable = await executableResolver(exec.signal)
      const result = await run(executable, argv, { signal: exec.signal })
      if (result.code !== 0) {
        fail('CLI_FAILED', 'official wecom-cli returned a non-zero status; sensitive stderr was withheld')
      }
      const data = redact(parseOutput(result.stdout, args.operation))
      const summary = args.operation === 'status'
        ? 'Official WeCom CLI version check completed.'
        : args.operation === 'auth_status'
          ? 'Official WeCom CLI authorization status check completed.'
          : 'Read-only WeCom operation completed with sensitive identifiers, paths, and URLs redacted.'
      return { ok: true, operation: args.operation, summary, data, truncated: Buffer.byteLength(String(result.stdout || '')) >= LIMITS.maxOutputBytes }
    },
  }
}

export const __test = { inspectInput, redact, safeJson, OPERATION_SPECS }
