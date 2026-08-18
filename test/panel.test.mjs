import test from 'node:test'
import assert from 'node:assert/strict'
import { Readable } from 'node:stream'
import { handleSetup } from '../lib/panel.mjs'

function request(body, headers = {}) {
  const req = Readable.from([Buffer.from(JSON.stringify(body))])
  req.method = 'POST'; req.headers = { host: '127.0.0.1:3081', 'content-type': 'application/json', ...headers }
  return req
}

function response() {
  let status = 0; let text = ''
  return { writeHead(value) { status = value }, end(value) { text = String(value) }, result() { return { status, body: JSON.parse(text) } } }
}

test('setup status exposes only the onboarding snapshot', async () => {
  const res = response()
  await handleSetup(request({ action: 'status' }), res, { status: async () => ({ installed: false, authorized: false }) })
  assert.deepEqual(res.result(), { status: 200, body: { ok: true, value: { installed: false, authorized: false } } })
})

test('authorization rejects missing intent before account mutation', async () => {
  let called = false; const res = response()
  await handleSetup(request({ action: 'authorize', confirmation: 'AUTHORIZE WECOM' }), res, { startAuthorization: async () => { called = true } })
  assert.equal(res.result().status, 409)
  assert.equal(res.result().body.error.code, 'INTENT_REQUIRED')
  assert.equal(called, false)
})

test('setup rejects cross-origin requests', async () => {
  const res = response()
  await handleSetup(request({ action: 'status' }, { origin: 'https://attacker.example' }), res, { status: async () => ({}) })
  assert.equal(res.result().status, 409)
  assert.equal(res.result().body.error.code, 'CROSS_ORIGIN')
})
