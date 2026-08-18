import { readFile, readdir, stat } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';

const lifecycleNames = ['preinstall', 'install', 'postinstall', 'prepare'];

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(path));
    else if (entry.isFile()) out.push(path);
  }
  return out;
}

function check(condition, message, errors) {
  if (!condition) errors.push(message);
}

export async function verifyAdapter(root) {
  const errors = [];
  const manifest = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
  const patchRel = manifest?.dsh?.bundle?.patch;

  check(manifest.name === 'dsh-wecom-cli', 'unexpected package name', errors);
  check(/^0\.1\.0$/.test(manifest.version), 'unexpected package version', errors);
  check(manifest.license === 'MIT', 'license must be MIT', errors);
  check(patchRel === './cordis.patch.yml', 'dsh.bundle.patch must be ./cordis.patch.yml', errors);
  check(Boolean(manifest.peerDependencies?.['@deepseek-ai/dsh-skill-filesystem']), 'missing dsh-skill-filesystem peer dependency', errors);
  for (const name of lifecycleNames) check(!manifest.scripts?.[name], 'lifecycle script ' + name + ' must be absent', errors);

  const patch = await readFile(join(root, 'cordis.patch.yml'), 'utf8');
  check((patch.match(/\bid:\s*dsh-wecom-cli-skill-provider\b/g) || []).length === 1, 'patch must insert exactly one unique adapter entry', errors);
  check(patch.includes("name: '@deepseek-ai/dsh-skill-filesystem'"), 'patch must use the official Skill filesystem provider', errors);
  check(patch.includes("new URL('skills/', baseUrl)"), 'patch must resolve the package-owned skills directory', errors);
  check(!/\b(disabled|remove|replace):/.test(patch), 'patch must not disable, remove, or replace rows', errors);

  const all = await walk(join(root, 'skills'));
  const skillFiles = all.filter((file) => file.endsWith(sep + 'SKILL.md'));
  check(skillFiles.length === 14, 'expected 14 Skills, found ' + skillFiles.length, errors);

  const names = new Set();
  for (const file of skillFiles) {
    const text = await readFile(file, 'utf8');
    const frontmatter = text.match(/^---\n([\s\S]*?)\n---/);
    check(Boolean(frontmatter), 'missing frontmatter: ' + relative(root, file), errors);
    const name = frontmatter?.[1].match(/^name:\s*(.+)$/m)?.[1]?.trim();
    check(Boolean(name), 'missing Skill name: ' + relative(root, file), errors);
    if (name) {
      check(!names.has(name), 'duplicate Skill name: ' + name, errors);
      names.add(name);
    }

    for (const match of text.matchAll(/\(((?:references|assets|scripts)\/[^)#?\s]+)(?:#[^)]+)?\)/g)) {
      const target = resolve(dirname(file), match[1]);
      check(target.startsWith(resolve(dirname(file)) + sep), 'unsafe relative resource: ' + match[1], errors);
      try { check((await stat(target)).isFile(), 'missing resource ' + match[1] + ' from ' + relative(root, file), errors); }
      catch { errors.push('missing resource ' + match[1] + ' from ' + relative(root, file)); }
    }
  }

  const shared = await readFile(join(root, 'skills/wecomcli-shared/SKILL.md'), 'utf8');
  check(!shared.includes('npm install -g'), 'shared Skill must not install the external CLI', errors);
  check(!shared.includes('wecom-cli auth init'), 'shared Skill must not automatically start authorization', errors);
  check(shared.includes('不得在当前流程中自动运行包管理器'), 'shared Skill must fail closed on missing CLI', errors);
  check(shared.includes('不得自动启动授权'), 'shared Skill must fail closed on missing authorization', errors);
  check(shared.includes('不读取、打印、复制或上传'), 'shared Skill must prohibit credential reads and disclosure', errors);

  for (const file of all.filter((path) => path.endsWith('.md'))) {
    const text = await readFile(file, 'utf8');
    check(!/(@deepseek-ai\/[^'"\x60\s]+)\s+(disable|remove|replace)/i.test(text), 'official component mutation language in ' + relative(root, file), errors);
  }

  return { ok: errors.length === 0, errors, skillCount: skillFiles.length, resourceCount: all.length };
}
