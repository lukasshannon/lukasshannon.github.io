"""Regression checks for candidate validation, generation, and cache promotion."""
import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]


def module(name):
    spec = importlib.util.spec_from_file_location(name, ROOT / 'scripts' / f'{name}.py')
    value = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(value)
    return value


prepare, checker = module('prepare'), module('check')


class Workflow(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.folder = Path(self.temp.name) / 'sample'
        prepare.new_app(self.folder, 'Sample <app>', 'sample')

    def test_valid_bundle_and_deterministic_release(self):
        checker.check(self.folder)
        before = (self.folder / 'sw.js').read_bytes()
        prepare.release(self.folder)
        self.assertEqual(before, (self.folder / 'sw.js').read_bytes())
        self.assertIn('Sample &lt;app&gt;', (self.folder / 'index.html').read_text())
        self.assertEqual((self.folder / 'icon-512.png').read_bytes()[:8], b'\x89PNG\r\n\x1a\n')

    def test_fatal_syntax_prevents_publication_gate(self):
        page = self.folder / 'index.html'
        page.write_text(page.read_text().replace('Mobile.ready();', 'const = ;'))
        prepare.release(self.folder)
        with self.assertRaises(ValueError):
            checker.check(self.folder)

    def test_edit_requires_new_release(self):
        page = self.folder / 'index.html'
        page.write_text(page.read_text().replace('Sample &lt;app&gt;', 'Changed'))
        with self.assertRaisesRegex(ValueError, 'Release is stale'):
            checker.check(self.folder)
        before = json.loads((self.folder / 'release.json').read_text())['revision']
        after = prepare.release(self.folder)
        self.assertNotEqual(before, after)
        checker.check(self.folder)

    def test_creation_does_not_overwrite_or_escape(self):
        with self.assertRaises(ValueError):
            prepare.new_app(self.folder, 'Replacement', 'sample')
        with self.assertRaises(ValueError):
            prepare.new_app(Path(self.temp.name) / 'bad', 'Bad', '../bad')
        page = self.folder / 'index.html'
        page.write_text(page.read_text().replace('</head>', '<script src="https://cdn.example.com/a.js"></script></head>'))
        prepare.release(self.folder)
        with self.assertRaisesRegex(ValueError, 'bundled'):
            checker.check(self.folder)

    def test_cache_update_failure_isolation_offline_and_rollback(self):
        result = subprocess.run(['node', str(ROOT / 'tests' / 'worker.mjs'), str(self.folder)], capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        print(result.stdout.strip())


if __name__ == '__main__':
    unittest.main(verbosity=2)
