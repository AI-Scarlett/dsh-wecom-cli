import { readFile, readdir, stat } from 'node:fs/promises'
import { dirname, join, relative, resolve, sep } from 'node:path'

const lifecycleNames = ['preinstall', 'install', 'postinstall', 'prepare']

async function walk(dir) {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...await walk(path))
    else if (entry.isFile()) out.push(path)
  }
  return out
}

function check(condition, message, errors) {
  if (!condition) errors.push(message)
}

export async function verifyAdapter(root) {
  const errors = []
  const manifest = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
  const patchRel = manifest?.dsh?.bundle?.patch

  check(manifest.name === 'dsh-wecom-cli', 'unexpected package name', errors)
  check(manifest.version === '0.1.2', 'unexpected package version', errors)
  check(manifest.main === './index.mjs', 'Host entry must be ./index.mjs', errors)
  check(manifest.license === 'MIT', 'license must be MIT', errors)
  check(patchRel === './cordis.patch.yml', 'dsh.bundle.patch must be ./cordis.patch.yml', errors)
  check(Boolean(manifest.peerDependencies?.['@deepseek-ai/dsh-tools']), 'missing dsh-tools peer dependency', errors)
  check(Boolean(manifest.peerDependencies?.['@deepseek-ai/dsh-skill-filesystem']), 'missing dsh-skill-filesystem peer dependency', errors)
  for (const name of lifecycleNames) check(!manifest.scripts?.[name], 'lifecycle script ' + name + ' must be absent', errors)

  const patch = await readFile(join(root, 'cordis.patch.yml'), 'utf8')
  check((patch.match(/\bid:\s*dsh-wecom-cli-host\b/g) || []).length === 1, 'patch must insert exactly one Host entry', errors)
  check((patch.match(/\bid:\s*dsh-wecom-cli-skill-provider\b/g) || []).length === 1, 'patch must insert exactly one Skill provider entry', errors)
  check(patch.includes('name: dsh-wecom-cli'), 'patch must load the package Host entry', errors)
  check(patch.includes("name: '@deepseek-ai/dsh-skill-filesystem'"), 'patch must use the official Skill filesystem provider', errors)
  check(patch.includes("new URL('skills/', baseUrl)"), 'patch must resolve the package-owned skills directory', errors)
  check(!/\b(disabled|remove|replace):/.test(patch), 'patch must not disable, remove, or replace rows', errors)

  const index = await readFile(join(root, 'index.mjs'), 'utf8')
  const bridge = await readFile(join(root, 'lib/bridge.mjs'), 'utf8')
  check(index.includes("name: 'wecom_cli_read'"), 'Host must register wecom_cli_read', errors)
  check(index.includes("inject = ['tools', 'subprocess']"), 'Host must inject tools and the official subprocess service', errors)
  check(bridge.includes('subprocess.spawn({'), 'bridge must use the official DSH subprocess service', errors)
  check(bridge.includes('argv: [executable, ...argv]'), 'bridge must spawn with a fixed argv array', errors)
  check(!bridge.includes('node:child_process'), 'bridge must not import Node child_process directly', errors)
  check(!/\bexec(?:File|Sync)?\s*\(/.test(bridge), 'bridge must not use exec APIs', errors)
  check(bridge.includes('READ_OPERATIONS'), 'bridge must expose a read-only operation allowlist', errors)
  check(bridge.includes('SECRET_INPUT_BLOCKED'), 'bridge must reject secrets', errors)
  check(bridge.includes('LOCAL_PATH_BLOCKED'), 'bridge must reject local paths', errors)
  check(bridge.includes('EFFECTFUL_FORMULA_BLOCKED'), 'bridge must reject effectful formulas', errors)
  check(bridge.includes('SQL_BLOCKED'), 'bridge must reject SQL', errors)

  const all = await walk(join(root, 'skills'))
  const skillFiles = all.filter((path) => path.endsWith(sep + 'SKILL.md'))
  check(skillFiles.length === 14, 'expected 14 Skills, found ' + skillFiles.length, errors)
  check(all.length === 14, 'legacy Skill references/assets/scripts must be removed; found ' + all.length + ' files', errors)

  const names = new Set()
  for (const file of skillFiles) {
    const text = await readFile(file, 'utf8')
    const frontmatter = text.match(/^---\n([\s\S]*?)\n---/)
    check(Boolean(frontmatter), 'missing frontmatter: ' + relative(root, file), errors)
    const name = frontmatter?.[1].match(/^name:\s*(.+)$/m)?.[1]?.trim()
    check(Boolean(name), 'missing Skill name: ' + relative(root, file), errors)
    if (name) {
      check(!names.has(name), 'duplicate Skill name: ' + name, errors)
      names.add(name)
    }
    check(text.includes('wecom_cli_read'), 'Skill must use the Host read tool: ' + relative(root, file), errors)
    check(!/^\s*wecom-cli\s+/m.test(text), 'Skill must not contain direct CLI instructions: ' + relative(root, file), errors)
    check(!/^\s*(?:curl|wget|python(?:3)?)\s+/im.test(text), 'Skill must not contain executable fallback process instructions: ' + relative(root, file), errors)
    for (const match of text.matchAll(/\(((?:references|assets|scripts)\/[^)#?\s]+)(?:#[^)]+)?\)/g)) {
      const target = resolve(dirname(file), match[1])
      check(target.startsWith(resolve(dirname(file)) + sep), 'unsafe relative resource: ' + match[1], errors)
      try { check((await stat(target)).isFile(), 'missing resource ' + match[1] + ' from ' + relative(root, file), errors) }
      catch { errors.push('missing resource ' + match[1] + ' from ' + relative(root, file)) }
    }
  }

  const shared = await readFile(join(root, 'skills/wecomcli-shared/SKILL.md'), 'utf8')
  check(!shared.includes('npm install -g'), 'shared Skill must not install the external CLI', errors)
  check(!shared.includes('wecom-cli auth init'), 'shared Skill must not automatically start authorization', errors)
  check(shared.includes('唯一执行入口'), 'shared Skill must declare the sole Host execution path', errors)
  check(shared.includes('禁止能力'), 'shared Skill must fail closed on unsupported effects', errors)

  return { ok: errors.length === 0, errors, skillCount: skillFiles.length, resourceCount: all.length }
}
