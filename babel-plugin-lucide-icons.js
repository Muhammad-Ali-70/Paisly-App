/**
 * Rewrites   import { Wallet, X } from 'lucide-react-native'
 * into       import Wallet from 'lucide-react-native/dist/cjs/icons/wallet.js'
 *            import X from 'lucide-react-native/dist/cjs/icons/x.js'
 *
 * Metro doesn't tree-shake, so the barrel import pulled all ~3,400 icon modules
 * into the bundle for the few dozen the app uses. The name → file map is read
 * from the package's own barrel, so aliases (e.g. "AlarmCheck") resolve exactly
 * as they would through the barrel, and it stays right across lucide upgrades.
 * Anything that isn't an icon (createLucideIcon, types...) stays on the barrel.
 */
const fs = require('fs');
const path = require('path');

const PACKAGE = 'lucide-react-native';
const ICON_DIR = `${PACKAGE}/dist/cjs/icons/`;

let iconFiles = null;
const loadIconFiles = () => {
  if (iconFiles) return iconFiles;
  iconFiles = new Map();
  // The package "exports" hides package.json, so start from its CJS entry
  // (dist/cjs/lucide-react-native.js) and step over to the ESM barrel
  const barrel = path.join(
    path.dirname(require.resolve(PACKAGE)),
    '../esm/lucide-react-native.mjs',
  );
  const source = fs.readFileSync(barrel, 'utf8');
  const exportLine = /export \{([^}]+)\} from '\.\/icons\/([\w-]+)\.mjs';/g;
  let match;
  while ((match = exportLine.exec(source))) {
    const file = `${ICON_DIR}${match[2]}.js`;
    for (const part of match[1].split(',')) {
      const name = /as\s+(\w+)/.exec(part)?.[1];
      if (name) iconFiles.set(name, file);
    }
  }
  return iconFiles;
};

module.exports = ({ types: t }) => ({
  name: 'lucide-icons-direct-import',
  visitor: {
    ImportDeclaration(nodePath) {
      const { node } = nodePath;
      if (node.source.value !== PACKAGE || node.importKind === 'type') return;
      const files = loadIconFiles();

      const direct = [];
      const remaining = [];
      for (const spec of node.specifiers) {
        const imported = t.isImportSpecifier(spec) ? spec.imported.name : null;
        const file = imported && files.get(imported);
        if (file) {
          direct.push(
            t.importDeclaration(
              [t.importDefaultSpecifier(t.identifier(spec.local.name))],
              t.stringLiteral(file),
            ),
          );
        } else {
          remaining.push(spec);
        }
      }
      if (!direct.length) return;

      if (remaining.length) {
        node.specifiers = remaining;
        nodePath.insertAfter(direct);
      } else {
        nodePath.replaceWithMultiple(direct);
      }
    },
  },
});
