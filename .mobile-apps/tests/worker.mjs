// Execute the real generated worker against browser API test doubles.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';

const folder = process.argv[2];
const original = await readFile(`${folder}/sw.js`, 'utf8');
const inventory = JSON.parse(await readFile(`${folder}/release.json`, 'utf8'));
const scope = 'https://example.test/apps/sample/';
const shared = new Map([['unrelated-app-cache', new Map()]]);
const caches = {
  async open(name) {
    if (!shared.has(name)) shared.set(name, new Map());
    const entries = shared.get(name);
    return {
      async put(url, response) { entries.set(String(url), response.clone()); },
      async match(url) { return entries.get(String(url))?.clone(); }
    };
  },
  async keys() { return [...shared.keys()]; },
  async delete(key) { return shared.delete(key); }
};
async function worker(code, { corrupt = false, offline = false } = {}) {
  const listeners = new Map();
  const self = { registration: { scope }, clients: { async claim() {} }, async skipWaiting() {}, addEventListener(type, callback) { listeners.set(type, callback); } };
  const fetch = async url => {
    if (offline) throw new Error('Network unavailable');
    const path = new URL(url).pathname.slice(new URL(scope).pathname.length);
    return new Response(corrupt && path === 'index.html' ? 'truncated download' : await readFile(`${folder}/${path}`));
  };
  vm.runInNewContext(code, { self, caches, fetch, URL, crypto: webcrypto, Uint8Array, Map, Error });
  return {
    async lifecycle(type) {
      let completion;
      listeners.get(type)({ waitUntil(value) { completion = value; } });
      await completion;
    },
    async get(url, method = 'GET') {
      let response;
      listeners.get('fetch')({ request: { url, method }, respondWith(value) { response = value; } });
      return response;
    }
  };
}

const first = await worker(original);
await first.lifecycle('install');
await first.lifecycle('activate');
const installedCache = [...shared.keys()].find(x => x.includes(inventory.revision));
assert.ok(installedCache);
const expectedPage = await readFile(`${folder}/index.html`, 'utf8');
const disconnected = await worker(original, { offline: true });
assert.equal(await (await disconnected.get(scope)).text(), expectedPage);
assert.equal(await disconnected.get('https://example.test/apps/other/'), undefined);
assert.equal(await disconnected.get(scope, 'POST'), undefined);

const changedCode = original.replace(inventory.revision, 'candidate-two');
const incomplete = await worker(changedCode, { corrupt: true });
await assert.rejects(incomplete.lifecycle('install'), /Incomplete release/);
assert.ok(shared.has(installedCache), 'failed candidate must retain live cache');
assert.equal([...shared.keys()].some(x => x.endsWith('candidate-two')), false);
assert.equal(await (await disconnected.get(scope)).text(), expectedPage);

const next = await worker(changedCode);
await next.lifecycle('install');
assert.ok(shared.has(installedCache), 'candidate installation cannot remove active cache');
await next.lifecycle('activate');
assert.equal(shared.has(installedCache), false);
assert.ok(shared.has('unrelated-app-cache'));

const rollback = await worker(original);
await rollback.lifecycle('install');
await rollback.lifecycle('activate');
assert.ok(shared.has(installedCache));
assert.ok(shared.has('unrelated-app-cache'));
assert.equal(await (await rollback.get(scope)).text(), expectedPage);
console.log('PASS: offline shell; rejected incomplete update; atomic cache promotion; app isolation; restored release.');
