import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const providerEntry = process.env.DSH_SKILL_PROVIDER_ENTRY;
const skillRoot = process.env.DSH_WECOM_SKILL_ROOT;
if (!providerEntry || !skillRoot) throw new Error('DSH_SKILL_PROVIDER_ENTRY and DSH_WECOM_SKILL_ROOT are required');

const { FileSystemSkillProvider } = await import(pathToFileURL(resolve(providerEntry)).href);
const controller = new AbortController();
const warnings = [];
const ctx = {
  get() { return undefined; },
  logger: { warn(message) { warnings.push(String(message)); } }
};
const provider = new FileSystemSkillProvider(ctx, {
  signal: controller.signal,
  invalidate() {}
}, {
  providerName: 'dsh-wecom-cli-e3',
  includeDefaultRoots: false,
  customSkillDirs: [resolve(skillRoot)],
  watch: false
});

try {
  const observation = await provider.list({ cwd: process.cwd() });
  const candidates = Array.isArray(observation) ? observation : observation.candidates;
  const names = candidates.map((item) => item.name).sort();
  if (names.length !== 14) throw new Error('expected 14 discovered Skills, found ' + names.length);
  if (!names.includes('wecomcli-shared')) throw new Error('shared prerequisite Skill was not discovered');
  for (const candidate of candidates) {
    const loaded = await provider.get(candidate, {});
    if (!loaded?.content || loaded.name !== candidate.name) throw new Error('failed to load Skill ' + candidate.name);
  }
  console.log(JSON.stringify({ ok: true, provider: provider.name, skillCount: names.length, names, warnings }, null, 2));
} finally {
  controller.abort();
  await provider.dispose();
}
