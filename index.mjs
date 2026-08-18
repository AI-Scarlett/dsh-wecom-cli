import { defineTool } from '@deepseek-ai/dsh-tools'
import { createWecomReadBridge, READ_OPERATIONS } from './lib/bridge.mjs'

export const name = 'dsh-wecom-cli-host'
export const inject = ['tools', 'subprocess']

export function apply(ctx) {
  const bridge = createWecomReadBridge({ subprocess: ctx.subprocess })
  ctx.tools.register(defineTool({
    name: 'wecom_cli_read',
    description: 'Run one bounded, read-only, allowlisted official WeCom CLI operation. This is the only supported execution path for dsh-wecom-cli v0.1.3. It rejects writes, uploads, downloads, arbitrary commands, secrets, local paths, effectful formulas, broad SQL, and shell syntax.',
    parameters: {
      operation: {
        type: 'string',
        required: true,
        enum: READ_OPERATIONS,
        description: 'Exact allowlisted read operation.',
      },
      input: {
        type: 'object',
        description: 'Structured JSON arguments. Secret-like fields, local paths, URLs, SQL, and over-budget values are rejected.',
        additionalProperties: true,
      },
      pageCount: {
        type: 'integer',
        description: 'Optional bounded pagination count, 1-3. Defaults to 1.',
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          ok: { type: 'boolean', required: true },
          operation: { type: 'string', required: true },
          summary: { type: 'string', required: true },
          data: { type: 'json', required: true },
          truncated: { type: 'boolean', required: true },
        },
      },
      render: (_args, value) => [{ type: 'text', text: value.summary }],
    },
    execute: (args, exec) => bridge.execute(args, { signal: exec.signal }),
  }))
}

export { createWecomReadBridge, READ_OPERATIONS }
