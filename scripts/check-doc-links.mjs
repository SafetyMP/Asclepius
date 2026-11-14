// Check repository-local Markdown destinations without making network requests.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], {
  cwd: root, encoding: 'utf8',
}).split('\0').filter((file) => file.endsWith('.md') || file === 'llms.txt');
const failures = [];
let checked = 0;
for (const file of new Set(files)) {
  const path = resolve(root, file);
  if (!existsSync(path)) continue; // A tracked deletion is not a document.
  const source = readFileSync(path, 'utf8').replace(/^(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1\s*$/gm, '');
  const destinations = [
    ...source.matchAll(/\]\(\s*(<[^>]+>|[^\s)]+)(?:\s+"[^"]*")?\s*\)/g),
    ...source.matchAll(/^\s*\[[^\]]+\]:\s*(<[^>]+>|\S+)/gm),
  ];
  for (const match of destinations) {
    const href = match[1].replace(/^<|>$/g, '');
    if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(href)) continue;
    const target = decodeURIComponent(href.split(/[?#]/)[0]);
    if (!target) continue;
    const destination = resolve(dirname(path), target);
    checked++;
    if (relative(root, destination).startsWith('..') || !existsSync(destination)) {
      failures.push(`${file}: missing or outside repository: ${href}`);
    }
  }
}
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Documentation links: ${checked} local destinations exist (${new Set(files).size} documents).`);
  console.log('External URLs and heading fragments are not checked.');
}
