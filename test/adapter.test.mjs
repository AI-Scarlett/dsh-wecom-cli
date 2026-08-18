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
  assert.equal(manifest.version, '0.1.1')
  assert.equal(manifest.main, './index.mjs')
  assert.ok(manifest.peerDependencies['@deepseek-ai/dsh-tools'])
  assert.ok(manifest.peerDependencies['@deepseek-ai/dsh-skill-filesystem'])
  for (const name of ['preinstall', 'install', 'postinstall', 'prepare']) assert.equal(manifest.scripts?.[name], undefined)
})

test('Skills require the Host tool and contain no direct command instructions', async () => {
  const shared = await readFile(new URL('../skills/wecomcli-shared/SKILL.md', import.meta.url), 'utf8')
  assert.match(shared, /唯一执行入口/)
  assert.match(shared, /wecom_cli_read/)
  assert.doesNotMatch(shared, /^\s*wecom-cli\s+/m)
  assert.doesNotMatch(shared, /npm install -g|wecom-cli auth init/)
})
