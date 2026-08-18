import { fileURLToPath } from 'node:url';
import { verifyAdapter } from './verify-lib.mjs';

const result = await verifyAdapter(fileURLToPath(new URL('..', import.meta.url)));
if (!result.ok) {
  for (const error of result.errors) console.error('ERROR: ' + error);
  process.exitCode = 1;
} else {
  console.log(JSON.stringify(result, null, 2));
}
