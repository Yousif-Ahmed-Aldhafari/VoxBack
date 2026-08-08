const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const Module = require('node:module');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const tests = [];
const originalResolve = Module._resolveFilename;

Module._resolveFilename = function resolveAlias(request, parent, isMain, options) {
  if (request.startsWith('@/')) {
    const resolved = path.join(root, 'src', request.slice(2));
    if (fs.existsSync(`${resolved}.ts`)) {
      return `${resolved}.ts`;
    }
    if (fs.existsSync(path.join(resolved, 'index.ts'))) {
      return path.join(resolved, 'index.ts');
    }
    return originalResolve.call(this, resolved, parent, isMain, options);
  }
  return originalResolve.call(this, request, parent, isMain, options);
};

require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
    },
    fileName: filename,
  }).outputText;
  module._compile(output, filename);
};

global.test = (name, fn) => {
  tests.push({ name, fn });
};
global.assert = assert;

function collect(dir) {
  if (!fs.existsSync(dir)) {
    return;
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collect(fullPath);
    } else if (entry.name.endsWith('.test.ts')) {
      require(fullPath);
    }
  }
}

collect(path.join(root, 'tests'));

(async () => {
  let failed = 0;
  for (const item of tests) {
    try {
      await item.fn();
      console.log(`ok - ${item.name}`);
    } catch (error) {
      failed += 1;
      console.error(`not ok - ${item.name}`);
      console.error(error);
    }
  }
  if (failed > 0) {
    process.exitCode = 1;
  }
})();
