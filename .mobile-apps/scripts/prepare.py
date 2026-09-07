#!/usr/bin/env python3
"""Create a self-contained app or refresh its content-addressed offline release."""
import argparse
import hashlib
import html
import json
from pathlib import Path
import re
import struct
import zlib

TEMPLATES = Path(__file__).resolve().parent.parent / 'templates'


def write_json(path, value):
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + '\n')


def icon(size):
    """Make a dependency-free, mask-safe letter A icon."""
    pattern = ['01110', '11011', '11011', '11111', '11011', '11011', '11011']
    scale = size // 12
    left, top = (size - 5 * scale) // 2, (size - 7 * scale) // 2
    rows = []
    for y in range(size):
        row = bytearray([0])
        for x in range(size):
            px, py = (x - left) // scale, (y - top) // scale
            lit = 0 <= px < 5 and 0 <= py < 7 and pattern[py][px] == '1'
            row.extend((134, 212, 255) if lit else (16, 26, 43))
        rows.append(row)
    def chunk(kind, data):
        return struct.pack('!I', len(data)) + kind + data + struct.pack('!I', zlib.crc32(kind + data) & 0xffffffff)
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('!2I5B', size, size, 8, 2, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(b''.join(rows), 9)) + chunk(b'IEND', b'')


def new_app(folder, name, slug):
    if not re.fullmatch(r'[a-z][a-z0-9]*(?:-[a-z0-9]+)*', slug):
        raise ValueError('Use a lowercase app slug with single hyphens.')
    if folder.exists() and any(folder.iterdir()):
        raise ValueError('Refusing to replace an existing app.')
    folder.mkdir(parents=True, exist_ok=True)
    page = (TEMPLATES / 'index.html').read_text().replace('__APP_NAME__', html.escape(name))
    page = page.replace('__MOBILE_RUNTIME__', (TEMPLATES / 'runtime.js').read_text())
    (folder / 'index.html').write_text(page)
    write_json(folder / 'app.json', {'name': name, 'slug': slug, 'storage_schema': 1})
    write_json(folder / 'manifest.webmanifest', {
        'id': './', 'name': name, 'short_name': name[:24], 'start_url': './', 'scope': './',
        'display': 'standalone', 'background_color': '#101a2b', 'theme_color': '#101a2b',
        'icons': [{'src': f'icon-{n}.png', 'sizes': f'{n}x{n}', 'type': 'image/png', 'purpose': 'any maskable'} for n in (192, 512)]
    })
    for size in (192, 512):
        (folder / f'icon-{size}.png').write_bytes(icon(size))
    return release(folder)


def release(folder):
    if not (folder / 'index.html').is_file():
        raise ValueError('Missing index.html')
    assets = {}
    for path in sorted(folder.rglob('*')):
        if path.is_symlink():
            raise ValueError('Symlinks are not supported in app releases.')
        if not path.is_file():
            continue
        relative = path.relative_to(folder).as_posix()
        if relative in ('sw.js', 'release.json'):
            continue
        if any(part.startswith('.') for part in path.relative_to(folder).parts):
            raise ValueError(f'Keep private/build files outside the public app: {relative}')
        assets[relative] = hashlib.sha256(path.read_bytes()).hexdigest()
    revision = hashlib.sha256(json.dumps(assets, sort_keys=True).encode()).hexdigest()[:20]
    # Include the worker template in the revision, so runtime cache policy edits deploy too.
    template = (TEMPLATES / 'sw.js').read_text()
    revision = hashlib.sha256((revision + template).encode()).hexdigest()[:20]
    worker = template.replace('__REVISION__', json.dumps(revision)).replace('__ASSETS__', json.dumps(assets, sort_keys=True))
    (folder / 'sw.js').write_text(worker)
    write_json(folder / 'release.json', {'revision': revision, 'assets': assets})
    return revision


def catalog(folder):
    apps = []
    for path in sorted(folder.glob('*/app.json')):
        app = json.loads(path.read_text())
        if app['slug'] != path.parent.name:
            raise ValueError(f'App slug does not match its stable folder: {path}')
        apps.append({'name': app['name'], 'slug': app['slug']})
    rows = '\n'.join(f'<li><a href="{html.escape(app["slug"])}/">{html.escape(app["name"])}</a></li>' for app in apps)
    content = f'<ul>{rows}</ul>' if apps else '<p class="empty">Your apps will appear here.<br>Describe your first app in ChatGPT to get started.</p>'
    runtime = (TEMPLATES / 'runtime.js').read_text()
    page = f'''<!doctype html>
<html lang="en" data-mobile-pwa="off"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#101a2b"><title>Apps</title>
<script>{runtime}</script>
<style>:root{{color-scheme:dark;background:#101a2b;color:#eef4ff;font:16px/1.6 system-ui,sans-serif}}*{{box-sizing:border-box}}body{{margin:0;padding:32px 24px 100px}}main{{max-width:680px;margin:auto}}h1{{font-size:2.5rem;letter-spacing:-.05em;line-height:1.1;margin:20px 0 32px}}ul{{list-style:none;padding:0}}li{{margin:12px 0}}a{{display:block;padding:20px;background:#1a2a44;border:1px solid #3c587b;border-radius:16px;color:#b2e4ff;font-size:1.15rem;text-decoration:none}}a:hover{{background:#253c5d}}a:focus-visible{{outline:3px solid #86d4ff;outline-offset:4px}}.empty{{border-top:1px solid #3c587b;padding-top:24px;color:#b8c8df}}</style>
</head><body><main><h1>Apps</h1>{content}</main><script>Mobile.ready();</script></body></html>
'''
    folder.mkdir(parents=True, exist_ok=True)
    (folder / 'index.html').write_text(page)
    write_json(folder / 'catalog.json', apps)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['new', 'release', 'catalog'])
    parser.add_argument('folder', type=Path)
    parser.add_argument('--name')
    parser.add_argument('--slug')
    args = parser.parse_args()
    if args.command == 'new':
        if not args.name or not args.slug:
            parser.error('new requires --name and --slug after the user confirms the name')
        print(new_app(args.folder, args.name, args.slug))
    elif args.command == 'release':
        print(release(args.folder))
    else:
        catalog(args.folder)
        print('App directory updated')


if __name__ == '__main__':
    main()
