import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { verifyAdapter } from '../scripts/verify-lib.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))

test('adapter verifies the Host bridge and all 14 safe Skill entrypoints', async () => {
  const result = await verifyAdapter(root)
  assert.deepEqual(result.errors, [])
  assert.equal(result.skillCount, 14)
  assert.equal(result.resourceCount, 14)
})

test('manifest exposes a Host entry and has no install-time lifecycle execution', async () => {
  const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
  assert.equal(manifest.version, '0.3.0')
  assert.equal(manifest.main, './index.mjs')
  assert.ok(manifest.dependencies['@deepseek-ai/dsh-tools'])
  assert.equal(manifest.peerDependencies?.['@deepseek-ai/dsh-tools'], undefined)
  for (const name of ['preinstall', 'install', 'postinstall', 'prepare']) assert.equal(manifest.scripts?.[name], undefined)
})

test('manifest exposes a Web Client without making Web mandatory for Host boot', async () => {
  const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
  const host = await readFile(new URL('../index.mjs', import.meta.url), 'utf8')
  assert.equal(manifest.exports['./client'], './client.js')
  assert.equal(manifest.dsh.client.platform, 'web')
  assert.match(host, /ctx\.inject\(\['webServer'\]/)
  assert.deepEqual(JSON.parse(JSON.stringify(manifest.dsh.client.inject)), ['@deepseek-ai/dsh-client-runtime', '@deepseek-ai/dsh-client-ui-slots', '@deepseek-ai/dsh-client-ui-settings'])
})

test('Bundle resolves Skills from the installed package instead of the composed Profile', async () => {
  const patch = await readFile(new URL('../cordis.patch.yml', import.meta.url), 'utf8')
  assert.match(patch, /createRequire\(baseUrl\)\.resolve\('dsh-wecom-cli\/package\.json'\)/)
  assert.doesNotMatch(patch, /new URL\('skills\/', baseUrl\)/)
})

test('Host Tool declares an rc.7-compatible explicit JSON output schema', async () => {
  const source = await readFile(new URL('../index.mjs', import.meta.url), 'utf8')
  assert.match(source, /data: \{ type: 'json', required: true \}/)
  assert.doesNotMatch(source, /data:\s*\{\s*\}/)
})

test('Skills require the Host tool and contain no direct command instructions', async () => {
  const shared = await readFile(new URL('../skills/wecomcli-shared/SKILL.md', import.meta.url), 'utf8')
  assert.match(shared, /唯一执行入口/)
  assert.match(shared, /wecom_cli_read/)
  assert.doesNotMatch(shared, /^\s*wecom-cli\s+/m)
  assert.doesNotMatch(shared, /npm install -g|wecom-cli auth init/)
})
