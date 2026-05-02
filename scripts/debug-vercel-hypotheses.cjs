/**
 * Debug: vérifie le contexte monorepo (hypothèses Vercel Next.js).
 * Exécuter depuis la racine: node scripts/debug-vercel-hypotheses.cjs
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
const logPath = path.join(root, 'debug-00c027.log');

function append(payload) {
  fs.appendFileSync(
    logPath,
    JSON.stringify({
      sessionId: '00c027',
      timestamp: Date.now(),
      ...payload,
    }) + '\n'
  );
}

// #region agent log
try {
  let gitHead = 'unknown';
  try {
    gitHead = execSync('git rev-parse HEAD', { cwd: root, encoding: 'utf8' }).trim();
  } catch (_) {}
  let gitWebMode = 'unknown';
  try {
    gitWebMode = execSync('git ls-tree HEAD web', { cwd: root, encoding: 'utf8' }).trim().split(/\s+/)[0] || 'missing';
  } catch (_) {}

  const rootPkgPath = path.join(root, 'package.json');
  const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf8'));
  const webPkgPath = path.join(root, 'web', 'package.json');
  const webPkgExists = fs.existsSync(webPkgPath);
  const webNextInPkg = webPkgExists
    ? JSON.parse(fs.readFileSync(webPkgPath, 'utf8')).dependencies?.next
    : null;
  const webNextMod = fs.existsSync(path.join(root, 'web', 'node_modules', 'next', 'package.json'));

  append({
    hypothesisId: 'H1',
    location: 'scripts/debug-vercel-hypotheses.cjs',
    message: 'git HEAD + web tree mode (160000=submodule)',
    data: { gitHead, gitWebMode },
  });
  append({
    hypothesisId: 'H2',
    location: 'scripts/debug-vercel-hypotheses.cjs',
    message: 'root package.json next field',
    data: {
      dependenciesNext: rootPkg.dependencies?.next,
      devDependenciesNext: rootPkg.devDependencies?.next,
    },
  });
  append({
    hypothesisId: 'H3',
    location: 'scripts/debug-vercel-hypotheses.cjs',
    message: 'web/package.json and node_modules/next',
    data: { webPkgExists, webNextInPkg, webNextMod },
  });
} catch (e) {
  append({
    hypothesisId: 'ERR',
    location: 'scripts/debug-vercel-hypotheses.cjs',
    message: String(e?.message || e),
    data: {},
  });
}
// #endregion
