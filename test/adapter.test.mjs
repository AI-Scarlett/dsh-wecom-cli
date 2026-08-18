import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { verifyAdapter } from '../scripts/verify-lib.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));

test('adapter fails closed on malformed contract and verifies all Skill resources', async () => {
  const result = await verifyAdapter(root);
  assert.deepEqual(result.errors, []);
  assert.equal(result.skillCount, 14);
  assert.ok(result.resourceCount >= 96);
});

test('manifest has no install-time lifecycle execution', async () => {
  const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  for (const name of ['preinstall', 'install', 'postinstall', 'prepare']) assert.equal(manifest.scripts?.[name], undefined);
});

test('shared prerequisite is read-only for setup and authorization', async () => {
  const shared = await readFile(new URL('../skills/wecomcli-shared/SKILL.md', import.meta.url), 'utf8');
  assert.doesNotMatch(shared, /npm install -g/);
  assert.doesNotMatch(shared, /wecom-cli auth init/);
  assert.match(shared, /不得在当前流程中自动运行包管理器/);
  assert.match(shared, /不得自动启动授权/);
});
