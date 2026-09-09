// Additional best-effort publication guard, not a substitute for code review.
// Inspect Git blobs, never print matching content or secret values.
import {execFileSync} from 'node:child_process';
import {readFile, readdir} from 'node:fs/promises';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const git = args => execFileSync('git', args, {cwd:root, maxBuffer:32*1024*1024});
const mode = process.argv[2] ?? '--staged';
if (!['--staged','--head'].includes(mode)) throw new Error('Use --staged or --head');
const known = new Set();
const remember = value => {
  if (typeof value !== 'string' || value.length < 16) return;
  known.add(value);
  if (/^0x[\da-f]{64}$/i.test(value)) known.add(value.slice(2));
  known.add(Buffer.from(value).toString('base64'));
};
const optionalRead = async path => {
  try { return await readFile(path,'utf8'); }
  catch (error) { if (error.code === 'ENOENT') return ''; throw error; }
};
const envText = await optionalRead(resolve(root,'.env'));
for (const line of envText.split(/\r?\n/)) {
  const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
  if (match && /(?:PRIVATE|SECRET|TOKEN|PASSWORD|API_KEY|MNEMONIC)/i.test(match[1])) remember(match[2].replace(/^(['"])(.*)\1$/,'$2'));
}
const rememberJson = value => {
  if (typeof value === 'string') remember(value);
  else if (value && typeof value === 'object') Object.values(value).forEach(rememberJson);
};
let secretFiles = [];
try { secretFiles = await readdir(resolve(root,'.secrets'),{withFileTypes:true}); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
for (const entry of secretFiles) {
  if (entry.isFile() && entry.name.endsWith('.json')) {
    rememberJson(JSON.parse(await readFile(resolve(root,'.secrets',entry.name),'utf8')));
  }
}
const paths = git(mode === '--head' ? ['ls-tree','-r','--name-only','-z','HEAD'] : ['ls-files','-z'])
  .toString('utf8').split('\0').filter(Boolean);
if (!paths.length) throw new Error('No Git files to scan');
const patterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bgh[pousr]_[A-Za-z0-9]{30,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{30,}\b/,
  /\b(?:sk-proj-|sk-ant-)[A-Za-z0-9_-]{20,}/,
  /["']?(?:[A-Z_]*PRIVATE_KEY|privateKey)["']?\s*[:=]\s*["']?(?:0x)?[a-f0-9]{64}/i,
  /https?:\/\/[^\s/@]+:[^\s/@]+@[^\s/]+/,
];
const failures = [];
for (const path of paths) {
  if (/(^|\/)(?:\.secrets|\.cache|\.venv|node_modules)(\/|$)/i.test(path)
    || (/(^|\/)\.env(?:\.|$)/i.test(path) && !path.endsWith('.env.example'))
    || /\.(?:pem|p12|pfx|key)$/i.test(path)) failures.push({path,reason:'Sensitive path'});
  const blob = git(['show',mode === '--head' ? `HEAD:${path}` : `:${path}`]);
  const content = blob.toString('utf8');
  if ([...known].some(value=>content.includes(value))) failures.push({path,reason:'Matches local secret'});
  if (patterns.some(pattern=>pattern.test(content))) failures.push({path,reason:'Credential pattern'});
}
if (failures.length) {
  for (const issue of failures) console.error(`${issue.path}: ${issue.reason}`);
  process.exitCode = 1;
} else console.log(`PASS: ${paths.length} ${mode === '--head' ? 'committed' : 'indexed'} files; no known local secrets, blocked paths, or credential patterns found.`);
