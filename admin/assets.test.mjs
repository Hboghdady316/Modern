import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../vanilla-site/', import.meta.url));

test('every public page resolves Three.js from bundled local assets', async () => {
  const pages = ['index.html', ...(await readdir(path.join(root, 'portfolio'))).filter(file => file.endsWith('.html')).map(file => `portfolio/${file}`)];
  for (const page of pages) {
    const html = await readFile(path.join(root, page), 'utf8');
    const map = JSON.parse(html.match(/<script type="importmap">([\s\S]*?)<\/script>/)[1]);
    assert.ok(map.imports.three.startsWith('.'), `${page} must not require a graphics CDN`);
    const module = path.resolve(root, path.dirname(page), map.imports.three);
    assert.ok((await stat(module)).isFile());
    const source = await readFile(module, 'utf8');
    for (const match of source.matchAll(/from\s*['"](\.\.?\/[^'"]+)['"]/g)) {
      assert.ok((await stat(path.resolve(path.dirname(module), match[1]))).isFile(), match[1]);
    }
    if (page === 'index.html') {
      const addons = path.resolve(root, map.imports['three/addons/']);
      for (const file of ['controls/OrbitControls.js', 'renderers/CSS2DRenderer.js']) assert.ok((await stat(path.join(addons, file))).isFile());
    }
  }
  assert.ok((await stat(path.join(root, 'assets/vendor/three/LICENSE'))).isFile());
});
