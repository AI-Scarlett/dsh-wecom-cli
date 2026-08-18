import { access, mkdtemp, readFile, realpath, rm, stat } from 'node:fs/promises'
import { constants } from 'node:fs'
import { tmpdir } from 'node:os'
import { isAbsolute, join, relative } from 'node:path'

const AUTH_TIMEOUT_MS = 5 * 60 * 1000 + 15_000
const QR_MAX_BYTES = 512 * 1024
const INSTALL_COMMAND = 'npm install --global @wecom/cli@1.1.0'
const INSTALL_CONFIRMATION = 'INSTALL WECOM CLI'
const INSTALL_TIMEOUT_MS = 3 * 60 * 1000
const INSTALL_ARGV = ['install', '--global', '@wecom/cli@1.1.0', '--no-audit', '--no-fund']

function safeError(code, message) {
  return Object.assign(new Error(message), { code })
}

async function collectedRun(subprocess, executable, argv, options = {}) {
  const signal = AbortSignal.timeout(options.timeoutMs ?? 15_000)
  const handle = subprocess.spawn({
    argv: [executable, ...argv], cwd: options.cwd ?? process.cwd(), signal, graceMs: 3_000,
    stdio: { stdin: 'ignore', stdout: { maxBytes: 64 * 1024 }, stderr: { maxBytes: 16 * 1024 } },
  })
  const outcome = await handle.done
  await handle.waitForExit()
  const stdout = handle.collected.stdout?.readFrom(0) ?? { text: '', lossy: false }
  if (stdout.lossy) throw safeError('CLI_OUTPUT_TOO_LARGE', 'WeCom CLI output exceeded the safe limit')
  return { code: outcome.exitCode, stdout: String(stdout.text || '').trim() }
}

export function createWecomOnboarding(options = {}) {
  const subprocess = options.subprocess
  let session = null
  let installSession = null

  async function executable() {
    try { return await subprocess.resolveExecutable('wecom-cli') }
    catch {}
    try {
      const npm = await subprocess.resolveExecutable('npm')
      const prefixResult = await collectedRun(subprocess, npm, ['prefix', '--global'])
      const prefix = prefixResult.code === 0 ? prefixResult.stdout : ''
      if (!prefix || prefix.length > 4096 || !isAbsolute(prefix) || prefix.includes('\n')) return null
      const candidate = join(prefix, 'bin', 'wecom-cli')
      const resolvedPrefix = await realpath(prefix)
      const resolvedCandidate = await realpath(candidate)
      const candidateRelative = relative(resolvedPrefix, resolvedCandidate)
      if (!candidateRelative || candidateRelative.startsWith('..') || isAbsolute(candidateRelative)) return null
      await access(resolvedCandidate, constants.X_OK)
      return resolvedCandidate
    } catch { return null }
  }

  async function baseStatus() {
    const path = await executable()
    if (!path) return { installed: false, version: null, authorized: false, installCommand: INSTALL_COMMAND }
    const versionResult = await collectedRun(subprocess, path, ['--version'])
    const version = versionResult.stdout.match(/\bv?(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)\b/)?.[1] ?? null
    const authResult = await collectedRun(subprocess, path, ['auth', 'show', '--status'])
    return {
      installed: versionResult.code === 0,
      version,
      authorized: authResult.code === 0 && authResult.stdout.toLowerCase() === 'authorized',
      installCommand: INSTALL_COMMAND,
    }
  }

  async function qrDataUrl() {
    if (!session?.qrPath) return null
    try {
      const info = await stat(session.qrPath)
      if (!info.isFile() || info.size <= 0 || info.size > QR_MAX_BYTES) return null
      return `data:image/png;base64,${(await readFile(session.qrPath)).toString('base64')}`
    } catch { return null }
  }

  async function status() {
    const base = await baseStatus()
    const auth = session ? {
      state: session.state,
      startedAt: session.startedAt,
      expiresAt: session.expiresAt,
      qrDataUrl: await qrDataUrl(),
      error: session.error ?? null,
    } : null
    const install = installSession ? {
      state: installSession.state,
      startedAt: installSession.startedAt,
      completedAt: installSession.completedAt ?? null,
      error: installSession.error ?? null,
    } : null
    return { ...base, install, auth }
  }

  async function startInstall(confirmation) {
    if (confirmation !== INSTALL_CONFIRMATION) throw safeError('CONFIRMATION_REQUIRED', `type ${INSTALL_CONFIRMATION} to install the official CLI`)
    if (installSession?.state === 'installing') throw safeError('INSTALL_ALREADY_RUNNING', 'the official WeCom CLI installation is already running')
    if (await executable()) throw safeError('WECOM_CLI_ALREADY_INSTALLED', 'the official WeCom CLI is already installed')
    let npm
    try { npm = await subprocess.resolveExecutable('npm') }
    catch { throw safeError('NPM_MISSING', 'npm is not available to the DSH Host') }
    const controller = new AbortController()
    const current = installSession = {
      state: 'installing', controller, startedAt: new Date().toISOString(), completedAt: null, error: null,
    }
    const handle = subprocess.spawn({
      argv: [npm, ...INSTALL_ARGV], cwd: process.cwd(), signal: controller.signal, graceMs: 5_000,
      stdio: { stdin: 'ignore', stdout: { maxBytes: 64 * 1024 }, stderr: { maxBytes: 64 * 1024 } },
    })
    handle.done.then(async outcome => {
      await handle.waitForExit().catch(() => {})
      if (installSession !== current) return
      current.completedAt = new Date().toISOString()
      if (controller.signal.aborted) current.state = 'cancelled'
      else if (outcome.exitCode !== 0) { current.state = 'failed'; current.error = 'Official WeCom CLI installation failed. Check npm permissions or use the displayed fixed command.' }
      else if (await executable()) current.state = 'completed'
      else { current.state = 'failed'; current.error = 'Installation completed but DSH could not locate wecom-cli. Restart DSH or use the displayed fixed command.' }
    }).catch(() => {
      if (installSession === current) {
        current.state = 'failed'; current.completedAt = new Date().toISOString()
        current.error = 'Official WeCom CLI installation could not be started.'
      }
    })
    setTimeout(() => {
      if (installSession === current && current.state === 'installing') controller.abort('installation timeout')
    }, INSTALL_TIMEOUT_MS).unref?.()
    return status()
  }

  async function cancelInstall() {
    if (installSession?.state === 'installing') installSession.controller.abort('cancelled by user')
    return status()
  }

  async function cleanup(current) {
    if (!current?.dir) return
    await rm(current.dir, { recursive: true, force: true }).catch(() => {})
  }

  async function startAuthorization(confirmation) {
    if (confirmation !== 'AUTHORIZE WECOM') throw safeError('CONFIRMATION_REQUIRED', 'type AUTHORIZE WECOM to start account authorization')
    if (session && ['starting', 'waiting-scan'].includes(session.state)) throw safeError('AUTH_ALREADY_RUNNING', 'an authorization session is already running')
    const path = await executable()
    if (!path) throw safeError('WECOM_CLI_MISSING', 'install the official WeCom CLI first')
    if (session) await cleanup(session)
    const dir = await mkdtemp(join(tmpdir(), 'dsh-wecom-auth-'))
    const controller = new AbortController()
    const current = session = {
      state: 'starting', dir, qrPath: join(dir, 'qr.png'), controller,
      startedAt: new Date().toISOString(), expiresAt: new Date(Date.now() + AUTH_TIMEOUT_MS).toISOString(), error: null,
    }
    const handle = subprocess.spawn({
      argv: [path, 'auth', 'init', '--noninteractive', '--no-browser', '--output-qrcode', 'qr.png'],
      cwd: dir, signal: controller.signal, graceMs: 3_000,
      stdio: { stdin: 'ignore', stdout: { maxBytes: 32 * 1024 }, stderr: { maxBytes: 32 * 1024 } },
    })
    current.state = 'waiting-scan'
    handle.done.then(async outcome => {
      await handle.waitForExit().catch(() => {})
      if (session !== current) return
      if (controller.signal.aborted) current.state = 'cancelled'
      else if (outcome.exitCode === 0) current.state = 'completed'
      else { current.state = 'failed'; current.error = 'Authorization did not complete. Retry and scan within five minutes.' }
    }).catch(() => {
      if (session === current) { current.state = 'failed'; current.error = 'Authorization process failed to start or exited unexpectedly.' }
    })
    setTimeout(() => {
      if (session === current && ['starting', 'waiting-scan'].includes(current.state)) controller.abort('authorization timeout')
    }, AUTH_TIMEOUT_MS).unref?.()
    return status()
  }

  async function cancelAuthorization() {
    if (session && ['starting', 'waiting-scan'].includes(session.state)) session.controller.abort('cancelled by user')
    return status()
  }

  async function testConnection() {
    const path = await executable()
    if (!path) throw safeError('WECOM_CLI_MISSING', 'install the official WeCom CLI first')
    const auth = await collectedRun(subprocess, path, ['auth', 'show', '--status'])
    if (auth.code !== 0 || auth.stdout.toLowerCase() !== 'authorized') throw safeError('WECOM_UNAUTHORIZED', 'authorize the WeCom CLI first')
    const result = await collectedRun(subprocess, path, ['identity', 'whoami', '--json', '{}'])
    if (result.code !== 0) throw safeError('WECOM_CONNECTION_FAILED', 'WeCom connection test failed')
    return { connected: true, checkedAt: new Date().toISOString() }
  }

  async function dispose() {
    if (installSession?.state === 'installing') installSession.controller.abort('plugin disposed')
    if (session) { session.controller.abort('plugin disposed'); await cleanup(session) }
  }

  return { status, startInstall, cancelInstall, startAuthorization, cancelAuthorization, testConnection, dispose }
}

export const __test = { INSTALL_COMMAND, INSTALL_CONFIRMATION, INSTALL_ARGV, INSTALL_TIMEOUT_MS, AUTH_TIMEOUT_MS, QR_MAX_BYTES }
