import test from 'node:test'
import assert from 'node:assert/strict'
import { createWecomOnboarding, __test } from '../lib/onboarding.mjs'

function subprocess(outputs = new Map()) {
  const calls = []
  return {
    calls,
    async resolveExecutable(name) { assert.equal(name, 'wecom-cli'); return '/approved/wecom-cli' },
    spawn(spec) {
      calls.push(spec)
      const key = spec.argv.slice(1).join(' ')
      const value = outputs.get(key) ?? { code: 0, stdout: '' }
      return {
        done: Promise.resolve({ exitCode: value.code, signal: null }), waitForExit: async () => true,
        collected: { stdout: { readFrom: () => ({ text: value.stdout, lossy: false }) }, stderr: { readFrom: () => ({ text: '', lossy: false }) } },
      }
    },
  }
}

test('status detects installed version and authorization without returning credentials', async () => {
  const runner = subprocess(new Map([
    ['--version', { code: 0, stdout: 'wecom-cli 1.1.0' }],
    ['auth show --status', { code: 0, stdout: 'authorized' }],
  ]))
  const value = await createWecomOnboarding({ subprocess: runner }).status()
  assert.deepEqual(value, { installed: true, version: '1.1.0', authorized: true, installCommand: __test.INSTALL_COMMAND, auth: null })
  assert.equal(JSON.stringify(value).includes('secret'), false)
})

test('authorization requires exact confirmation and uses fixed noninteractive QR argv', async () => {
  const runner = subprocess(new Map([
    ['--version', { code: 0, stdout: 'wecom-cli 1.1.0' }],
    ['auth show --status', { code: 0, stdout: 'unauthorized' }],
  ]))
  const onboarding = createWecomOnboarding({ subprocess: runner })
  await assert.rejects(() => onboarding.startAuthorization('yes'), error => error.code === 'CONFIRMATION_REQUIRED')
  await onboarding.startAuthorization('AUTHORIZE WECOM')
  const authCall = runner.calls.find(call => call.argv.includes('init'))
  assert.deepEqual(authCall.argv, ['/approved/wecom-cli', 'auth', 'init', '--noninteractive', '--no-browser', '--output-qrcode', 'qr.png'])
  assert.equal(authCall.stdio.stdin, 'ignore')
  await onboarding.dispose()
})

test('connection test returns only a bounded success receipt', async () => {
  const runner = subprocess(new Map([
    ['auth show --status', { code: 0, stdout: 'authorized' }],
    ['identity whoami --json {}', { code: 0, stdout: '{"userid":"private"}' }],
  ]))
  const value = await createWecomOnboarding({ subprocess: runner }).testConnection()
  assert.equal(value.connected, true)
  assert.equal(JSON.stringify(value).includes('private'), false)
})
