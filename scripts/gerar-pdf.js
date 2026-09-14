const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..', '..');
const projectDir = path.join(rootDir, 'MeuOrcamento');
const htmlPath = path.join(projectDir, 'docs', 'manual-meu-orcamento.html');
const out1 = path.join(rootDir, 'Manual-Meu-Orcamento.pdf');
const out2 = path.join(projectDir, 'docs', 'Manual-Meu-Orcamento.pdf');

function findBrowser() {
  const candidates = [];
  const pf = process.env['ProgramFiles'] || 'C:\\Program Files';
  const pf86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
  const local = process.env['LocalAppData'] || 'C:\\Users\\' + (process.env['USERNAME'] || '') + '\\AppData\\Local';
  candidates.push(path.join(pf, 'Microsoft', 'Edge', 'Application', 'msedge.exe'));
  candidates.push(path.join(pf86, 'Microsoft', 'Edge', 'Application', 'msedge.exe'));
  candidates.push(path.join(local, 'Microsoft', 'Edge', 'Application', 'msedge.exe'));
  candidates.push(path.join(pf, 'Google', 'Chrome', 'Application', 'chrome.exe'));
  candidates.push(path.join(local, 'Google', 'Chrome', 'Application', 'chrome.exe'));
  for (const c of candidates) {
    try { if (fs.existsSync(c) && fs.statSync(c).size > 10000) return c; } catch (_) {}
  }
  return null;
}

if (!fs.existsSync(htmlPath)) {
  console.error('[ERRO] HTML nao existe:', htmlPath);
  process.exit(1);
}
const br = findBrowser();
if (!br) {
  console.error('[FALHA] Nenhum Chrome/Edge encontrado. Solucao manual:');
  console.error('  Abrir no navegador:', htmlPath);
  console.error('  Ctrl+P -> Salvar como PDF ->', out1);
  process.exit(2);
}
console.log('[OK] Navegador:', br);

const htmlUri = 'file:///' + htmlPath.split(path.sep).join('/');
const attempts = [
  { label: 'pasta raiz C:\\MeuOrsamento', out: out1 },
  { label: 'pasta docs', out: out2 },
  { label: 'TEMP + copiar', out: path.join(process.env.TEMP || process.env.TMP || '/tmp', 'manual-mo-' + Date.now() + '.pdf') }
];

let successPath = null;
for (const a of attempts) {
  console.log('\nTentativa [' + a.label + '] -> ' + a.out);
  try { fs.unlinkSync(a.out); } catch (_) {}
  const args = [
    '--headless',
    '--disable-gpu',
    '--no-sandbox',
    '--hide-scrollbars',
    '--print-to-pdf-no-header',
    '--print-to-pdf=' + a.out,
    htmlUri
  ];
  const child = spawnSync(br, args, { timeout: 60000, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true, shell: false });
  if (child.error) {
    console.log('  erro spawn:', child.error.message);
    continue;
  }
  let info = null;
  try { info = fs.statSync(a.out); } catch (_) {}
  if (info && info.size > 8000) {
    console.log('  SUCESSO! ' + info.size + ' bytes');
    successPath = a.out;
    break;
  } else {
    console.log('  falhou (tamanho ou arquivo nao criado). status=' + child.status);
    if (child.stderr && child.stderr.length) console.log('  stderr: ' + child.stderr.toString('utf8').slice(0, 400));
  }
}

if (!successPath) {
  console.error('\n[FALHA] Todas tentativas falharam. Solucao manual:');
  console.error('  1) Abrir: ', htmlPath);
  console.error('  2) Ctrl+P -> "Salvar como PDF"');
  console.error('  3) Salvar em: ', out1);
  process.exit(3);
}

try { if (successPath !== out1) fs.copyFileSync(successPath, out1); } catch(e){ console.log('  copy out1 warn:', e.message); }
try { if (successPath !== out2) fs.copyFileSync(successPath, out2); } catch(e){ console.log('  copy out2 warn:', e.message); }

console.log('\n==================================');
console.log('PDF GERADO COM SUCESSO!');
console.log('Local 1 : ' + out1);
console.log('Local 2 : ' + out2);
try {
  const s1 = fs.statSync(out1);
  console.log('Tamanho : ' + s1.size + ' bytes (' + (s1.size/1024).toFixed(1) + ' KB)');
} catch(_){}
console.log('==================================');
process.exit(0);
