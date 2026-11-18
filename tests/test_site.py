"""Behavioral coverage for shared content and externally collected usage data."""

import copy
import json
from pathlib import Path
import sys
import tempfile
import unittest
from urllib.error import URLError

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import catalog
import download_stats
import export_site


class WebsiteExportTests(unittest.TestCase):
    def test_export_uses_every_canonical_record_and_both_editorial_sections(self):
        taxonomy, records = catalog.load_catalog()
        payload = export_site.build_payload()
        by_id = {record["meta"]["id"]: record for record in records}
        self.assertEqual(payload["taxonomy"], taxonomy)
        self.assertEqual(set(by_id), {record["id"] for record in payload["resources"]})
        for exported in payload["resources"]:
            source = by_id[exported["id"]]
            self.assertEqual(exported["summary"], source["meta"]["summary"])
            self.assertEqual(exported["path"], source["path"].relative_to(ROOT).as_posix())
            for description in exported["description"]:
                self.assertTrue(description.strip())
                self.assertIn(description, source["body"])
                self.assertNotIn("<!-- resource:start -->", description)

    def test_editing_one_source_changes_both_document_and_website_output(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "data").mkdir()
            taxonomy = {
                "directions": {"rtl-generation": ["RTL", "RTL"]},
                "tags": {"rtl": ["RTL", "RTL"], "generation": ["Generation", "生成"]},
                "types": {"project": ["Project", "项目"]},
            }
            (root / "data/taxonomy.json").write_text(json.dumps(taxonomy))
            (root / "data/repo-stats.json").write_text("{}")
            meta = {
                "id": "example", "name": "Example", "title": "Example",
                "direction": "rtl-generation", "tags": ["rtl", "generation"],
                "types": ["project"], "date": "2026-01", "date_basis": "source",
                "summary": ["Original summary", "原始简介"],
                "links": [{"label": "Source", "kind": "source", "url": "https://example.org/"}],
                "related": [], "also_in": [],
            }
            path = root / "resources/rtl-generation/example.md"
            path.parent.mkdir(parents=True)
            body = "# Example\n\n<!-- metadata\n" + json.dumps(meta) + "\n-->\n\n"
            body += "<!-- resource:start -->\n<!-- resource:end -->\n\n"
            body += "## English\n\nOriginal explanation.\n\n## 简体中文\n\n原始说明。\n"
            path.write_text(body)
            original = export_site.build_payload(root)
            path.write_text(body.replace("Original explanation.", "Updated explanation.").replace("原始说明。", "更新后的说明。"))
            updated = export_site.build_payload(root)
            vocabulary, records = catalog.load_catalog(root)
            rendered = catalog.render_all(vocabulary, records, {})[path]
            self.assertNotEqual(original["resources"][0]["description"], updated["resources"][0]["description"])
            for description in updated["resources"][0]["description"]:
                self.assertIn(description, rendered)


class DownloadMetricTests(unittest.TestCase):
    def records(self, source):
        return [{"meta": {"id": "example", "download_sources": [source]}}]

    def test_npm_keeps_provider_interval_and_scoped_package_identity(self):
        source = {"id": "npm", "provider": "npm", "package": "@author/chip", "period": "last-week"}
        urls = []

        def fetch(url):
            urls.append(url)
            return {"package": "@author/chip", "downloads": 37, "start": "2026-11-01", "end": "2026-11-07"}

        data, failures = download_stats.refresh(self.records(source), {}, fetch, "2026-11-18T00:00:00Z")
        self.assertFalse(failures)
        self.assertIn("%40author%2Fchip", urls[0])
        self.assertEqual(data["example:npm"]["value"], 37)
        self.assertEqual(data["example:npm"]["start"], "2026-11-01")
        self.assertEqual(data["example:npm"]["end"], "2026-11-07")

    def test_failed_refresh_preserves_count_and_collection_time_without_mutating_cache(self):
        source = {"id": "npm", "provider": "npm", "package": "chip"}
        old = {"example:npm": {"source": source.copy(), "value": 21, "fetched_at": "2026-11-01T00:00:00Z"}}
        untouched = copy.deepcopy(old)

        def fetch(url):
            raise URLError("offline")

        data, failures = download_stats.refresh(self.records(source), old, fetch, "2026-11-18T00:00:00Z")
        self.assertEqual(old, untouched)
        self.assertEqual(len(failures), 1)
        self.assertEqual(data["example:npm"]["value"], 21)
        self.assertEqual(data["example:npm"]["fetched_at"], "2026-11-01T00:00:00Z")
        self.assertEqual(data["example:npm"]["last_attempt_at"], "2026-11-18T00:00:00Z")

    def test_changed_package_never_reuses_old_packages_counts(self):
        source = {"id": "npm", "provider": "npm", "package": "new-chip"}
        old = {"example:npm": {"source": {**source, "package": "old-chip"}, "value": 99}}

        def fetch(url):
            raise URLError("offline")

        data, failures = download_stats.refresh(self.records(source), old, fetch, "2026-11-18T00:00:00Z")
        self.assertTrue(failures)
        self.assertNotIn("value", data["example:npm"])

    def test_invalid_counter_does_not_become_zero(self):
        source = {"id": "npm", "provider": "npm", "package": "chip"}
        for count in (-1, True, "12"):
            with self.subTest(count=count):
                def fetch(url):
                    return {"package": "chip", "downloads": count, "start": "2026-11-01", "end": "2026-11-07"}
                data, failures = download_stats.refresh(self.records(source), {}, fetch, "2026-11-18T00:00:00Z")
                self.assertTrue(failures)
                self.assertNotIn("value", data["example:npm"])

    def test_release_and_asset_selectors_apply_across_asset_pages(self):
        source = {"id": "assets", "provider": "github-releases", "repository": "author/chip", "tag_prefix": "mcp-", "asset_pattern": "*.whl"}
        urls = []

        def fetch(url):
            urls.append(url)
            if "/assets?" not in url:
                return [
                    {"id": 1, "tag_name": "mcp-v1", "draft": False, "prerelease": False},
                    {"id": 2, "tag_name": "ui-v1", "draft": False, "prerelease": False},
                    {"id": 3, "tag_name": "mcp-v2", "draft": False, "prerelease": True},
                ]
            if url.endswith("page=1"):
                return [{"id": i, "name": "chip.whl" if i else "preview.zip", "download_count": 1} for i in range(100)]
            return [{"id": 100, "name": "chip.whl", "download_count": 5}]

        result = download_stats.collect(source, fetch)
        self.assertEqual(result["value"], 104)
        self.assertEqual(result["asset_count"], 100)
        self.assertEqual(result["release_count"], 1)
        self.assertEqual(len(urls), 3)
        self.assertTrue(any(url.endswith("page=2") for url in urls))

    def test_pypi_daily_cache_retains_a_real_zero(self):
        source = {"id": "pypi", "provider": "pypistats", "package": "chip-mcp", "period": "month"}
        calls = []

        def fetch(url):
            calls.append(url)
            return {"package": "chip_mcp", "data": {"last_month": 0}}

        data, failures = download_stats.refresh(self.records(source), {}, fetch, "2026-11-18T00:00:00Z")
        later, failures = download_stats.refresh(self.records(source), data, fetch, "2026-11-18T12:00:00Z")
        self.assertFalse(failures)
        self.assertEqual(len(calls), 1)
        self.assertEqual(later["example:pypi"]["value"], 0)

    def test_source_validation_rejects_unlinked_repositories_and_duplicate_ids(self):
        meta = {"id": "example", "links": [{"url": "https://github.com/author/chip"}]}
        for sources in (
            [{"id": "assets", "provider": "github-releases", "repository": "other/chip"}],
            [{"id": "npm", "provider": "npm", "package": "chip"}] * 2,
            [{"id": "npm", "provider": "npm", "package": "chip", "period": "all-time"}],
        ):
            with self.subTest(sources=sources), self.assertRaises(ValueError):
                catalog.validate_download_sources({**meta, "download_sources": sources})


if __name__ == "__main__":
    unittest.main()
