#!/usr/bin/env python3
"""Static half of the release gate. A separate browser smoke check is required."""
import argparse
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import subprocess
import tempfile
from urllib.parse import unquote, urlsplit


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.scripts, self.assets, self.inline = [], [], None
        self.viewport = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'meta' and attrs.get('name') == 'viewport':
            self.viewport = 'width=device-width' in attrs.get('content', '')
        if tag == 'script':
            if attrs.get('src'):
                self.assets.append(attrs['src'])
            elif attrs.get('type', '') not in ('application/json', 'application/ld+json', 'importmap'):
                self.inline = {'code': '', 'module': attrs.get('type') == 'module'}
        if tag in ('img', 'audio', 'video', 'source', 'iframe') and attrs.get('src'):
            self.assets.append(attrs['src'])
        if tag == 'link' and attrs.get('rel') in ('stylesheet', 'icon', 'manifest', 'modulepreload', 'preload'):
            self.assets.append(attrs.get('href', ''))

    def handle_data(self, data):
        if self.inline is not None:
            self.inline['code'] += data

    def handle_endtag(self, tag):
        if tag == 'script' and self.inline is not None:
            self.scripts.append(self.inline)
            self.inline = None


def javascript(code, module=False):
    with tempfile.NamedTemporaryFile('w', suffix='.mjs' if module else '.js') as temp:
        temp.write(code)
        temp.flush()
        result = subprocess.run(['node', '--check', temp.name], capture_output=True, text=True)
    if result.returncode:
        raise ValueError(result.stderr)


def check(folder, catalog=False):
    folder = folder.resolve()
    page_count = 0
    for path in (folder.glob('*.html') if catalog else folder.rglob('*.html')):
        page_count += 1
        source = path.read_text()
        if re.search(r'__(APP_NAME|MOBILE_RUNTIME|ASSETS|REVISION)__', source):
            raise ValueError('Unexpanded template placeholder')
        page = Page()
        page.feed(source)
        if not page.viewport:
            raise ValueError(f'{path.name}: missing mobile viewport')
        for script in page.scripts:
            javascript(script['code'], script['module'])
        for asset in page.assets:
            url = urlsplit(asset)
            if url.scheme in ('data', 'blob'):
                continue
            if url.scheme or url.netloc or url.path.startswith('/'):
                raise ValueError(f'Use bundled, app-relative assets: {asset}')
            target = (path.parent / unquote(url.path)).resolve()
            if not target.is_relative_to(folder) or not target.is_file():
                raise ValueError(f'Missing or non-isolated asset: {asset}')
    if not page_count:
        raise ValueError('No app page')
    if catalog:
        return
    for script in folder.rglob('*.js'):
        javascript(script.read_text(), module=True)
    manifest = json.loads((folder / 'manifest.webmanifest').read_text())
    if manifest['scope'] != './' or manifest['start_url'] != './' or manifest['id'] != './':
        raise ValueError('Manifest must be scoped to this app')
    for icon in manifest['icons']:
        if not (folder / icon['src']).is_file():
            raise ValueError('Missing install icon')
    release = json.loads((folder / 'release.json').read_text())
    for name, expected in release['assets'].items():
        if hashlib.sha256((folder / name).read_bytes()).hexdigest() != expected:
            raise ValueError(f'Release is stale: {name}; run prepare.py release again')
    if release['revision'] not in (folder / 'sw.js').read_text():
        raise ValueError('Worker and release revision differ')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('folder', type=Path)
    parser.add_argument('--catalog', action='store_true')
    args = parser.parse_args()
    check(args.folder, args.catalog)
    print('PASS: syntax, entrypoints, local assets, manifest, and release hashes. Browser smoke check still required.')
