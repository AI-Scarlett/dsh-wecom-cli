import test from 'node:test'
import assert from 'node:assert/strict'
import { createWecomReadBridge, LIMITS, READ_OPERATIONS } from '../lib/bridge.mjs'

function harness(result = { code: 0, signal: null, stdout: '{}', stderr: '' }) {
  const calls = []
  const bridge = createWecomReadBridge({
    executableResolver: async () => '/approved/wecom-cli',
    run: async (executable, argv, options) => { calls.push({ executable, argv, options }); return result },
  })
  return { bridge, calls }
}

test('uses an allowlisted operation and keeps hostile text in one JSON argv element', async () => {
  const { bridge, calls } = harness({ code: 0, stdout: '{"name":"safe"}', stderr: '' })
  const hostile = '\"; touch /tmp/dsh-wecom-sentinel; #'
  const out = await bridge.execute({ operation: 'contact_users_search', input: { keyword: hostile } }, {})
  assert.equal(out.ok, true)
  assert.equal(calls.length, 1)
  assert.equal(calls[0].executable, '/approved/wecom-cli')
  assert.deepEqual(calls[0].argv.slice(0, 4), ['contact', 'users', 'search', '--json'])
  assert.equal(calls[0].argv.length, 5)
  assert.deepEqual(JSON.parse(calls[0].argv[4]), { keyword: hostile })
  assert.equal(calls[0].options.signal, undefined)
})

test('rejects unknown operations and every write-shaped operation', async () => {
  const { bridge, calls } = harness()
  for (const operation of ['message_send', 'todo_delete', 'smartsheet_records_update', 'shell']) {
    await assert.rejects(() => bridge.execute({ operation, input: {} }), (error) => error.code === 'OPERATION_NOT_ALLOWED')
  }
  assert.equal(calls.length, 0)
  assert.ok(READ_OPERATIONS.every((name) => /(?:status|whoami|search|list|get)$/.test(name)))
})

test('rejects secrets, local paths, URLs, SQL, and effectful formulas before process execution', async () => {
  const cases = [
    { password: 'secret' },
    { file_path: '/tmp/private.csv' },
    { link: 'https://example.com/signed?token=x' },
    { query: 'SELECT * FROM table LIMIT 100' },
    { formula: 'ADDRECORD(Table, {a: 1})' },
  ]
  for (const input of cases) {
    const { bridge, calls } = harness()
    await assert.rejects(() => bridge.execute({ operation: 'doc_search', input }), /not allowed|blocked|SQL|secret|path/i)
    assert.equal(calls.length, 0)
  }
})

test('enforces pagination and serialized input budgets', async () => {
  const { bridge, calls } = harness()
  await assert.rejects(() => bridge.execute({ operation: 'doc_search', input: {}, pageCount: LIMITS.maxPageCount + 1 }), (error) => error.code === 'PAGE_LIMIT')
  await assert.rejects(() => bridge.execute({ operation: 'identity_whoami', input: {}, pageCount: 2 }), (error) => error.code === 'PAGINATION_NOT_SUPPORTED')
  await assert.rejects(() => bridge.execute({ operation: 'doc_search', input: { q: 'x'.repeat(LIMITS.maxStringLength + 1) } }), (error) => error.code === 'STRING_TOO_LARGE')
  assert.equal(calls.length, 0)
})

test('redacts identifiers, absolute paths, secrets, and capability URLs from output', async () => {
  const { bridge } = harness({
    code: 0,
    stderr: '',
    stdout: JSON.stringify({ userid: 'u1', file_path: '/tmp/a', attach_url: 'https://host/x?sig=y', password: 'p', nested: { docid: 'd1', name: 'Readable' } }),
  })
  const out = await bridge.execute({ operation: 'mail_get', input: { subject: 'hello' } })
  assert.equal(out.data.userid, '[redacted-id]')
  assert.equal(out.data.file_path, '[redacted-path]')
  assert.equal(out.data.attach_url, '[redacted-url]')
  assert.equal(out.data.password, '[redacted-secret]')
  assert.equal(out.data.nested.docid, '[redacted-id]')
  assert.equal(out.data.nested.name, 'Readable')
})

test('does not expose stderr when the official CLI fails', async () => {
  const { bridge } = harness({ code: 2, stdout: '', stderr: 'token=top-secret /Users/private/file' })
  await assert.rejects(
    () => bridge.execute({ operation: 'status' }),
    (error) => error.code === 'CLI_FAILED' && !error.message.includes('top-secret') && !error.message.includes('/Users/private'),
  )
})

test('uses the official managed subprocess contract without env or spill', async () => {
  const specs = []
  const subprocess = {
    async resolveExecutable(command, env) {
      assert.equal(command, 'wecom-cli')
      assert.equal(env, undefined)
      return '/managed/wecom-cli'
    },
    spawn(spec) {
      specs.push(spec)
      return {
        done: Promise.resolve({ exitCode: 0, signal: null }),
        waitForExit: async () => true,
        collected: {
          stdout: { readFrom: () => ({ text: '{"name":"ok"}', nextOffset: 13, lossy: false }) },
          stderr: { readFrom: () => ({ text: '', nextOffset: 0, lossy: false }) },
        },
      }
    },
  }
  const bridge = createWecomReadBridge({ subprocess, cwd: '/fixed/workspace' })
  const out = await bridge.execute({ operation: 'disk_files_search', input: { keywords: ['report'], limit: 10 }, pageCount: 2 })
  assert.equal(out.ok, true)
  assert.equal(specs.length, 1)
  assert.deepEqual(specs[0].argv, ['/managed/wecom-cli', 'disk', 'files', 'search', '--json', '{"keywords":["report"],"limit":10}', '--page-count', '2'])
  assert.equal(specs[0].cwd, '/fixed/workspace')
  assert.equal(specs[0].stdio.stdin, 'ignore')
  assert.deepEqual(specs[0].stdio.stdout, { maxBytes: LIMITS.maxOutputBytes })
  assert.equal('spill' in specs[0].stdio.stdout, false)
  assert.equal(specs[0].env, undefined)
})
