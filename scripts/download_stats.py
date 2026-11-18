#!/usr/bin/env python3
"""Refresh explicitly configured download sources; retain good snapshots on failure."""

import argparse
from datetime import date, datetime, timezone
from fnmatch import fnmatchcase
from functools import lru_cache
import json
import os
import re
import subprocess
import sys
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen


@lru_cache(maxsize=1)
def github_token():
    token = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
    if token:
        return token
    try:
        result = subprocess.run(
            ["gh", "auth", "token", "--hostname", "github.com"],
            capture_output=True, text=True, timeout=5, check=False,
        )
        return result.stdout.strip() if result.returncode == 0 else None
    except (OSError, subprocess.TimeoutExpired):
        return None


def fetch_json(url):
    headers = {"User-Agent": "awesome-chip-agents-catalog"}
    if url.startswith("https://api.github.com/"):
        headers["Accept"] = "application/vnd.github+json"
        token = github_token()
        if token:
            headers["Authorization"] = "Bearer " + token
    with urlopen(Request(url, headers=headers), timeout=20) as response:
        return json.load(response)


def nonnegative(value):
    if type(value) is not int or value < 0:
        raise ValueError("Invalid download count")
    return value


def paginated(url, fetch):
    for page in range(1, 101):
        payload = fetch(url + "?per_page=100&page=" + str(page))
        if not isinstance(payload, list):
            raise ValueError("Invalid paginated response")
        yield from payload
        if len(payload) < 100:
            return
    raise ValueError("Pagination limit exceeded; refusing a partial count")


def collect(source, fetch):
    provider = source["provider"]
    if provider == "npm":
        url = "https://api.npmjs.org/downloads/point/" + source.get("period", "last-month") + "/" + quote(source["package"], safe="")
        payload = fetch(url)
        if payload["package"].lower() != source["package"].lower():
            raise ValueError("Package identity mismatch")
        start, end = payload["start"], payload["end"]
        if date.fromisoformat(start) > date.fromisoformat(end):
            raise ValueError("Invalid reporting interval")
        return {"value": nonnegative(payload["downloads"]), "start": start, "end": end, "url": url}
    if provider == "pypistats":
        url = "https://pypistats.org/api/packages/" + quote(source["package"], safe="") + "/recent"
        payload = fetch(url)
        normalize = lambda name: re.sub(r"[-_.]+", "-", name).lower()
        if normalize(payload["package"]) != normalize(source["package"]):
            raise ValueError("Package identity mismatch")
        period = source.get("period", "month")
        return {
            "value": nonnegative(payload["data"]["last_" + period]),
            "period": period, "url": url,
        }
    if provider != "github-releases":
        raise ValueError("Unsupported provider")
    api = "https://api.github.com/repos/" + source["repository"] + "/releases"
    total, assets, releases = 0, set(), 0
    for release in paginated(api, fetch):
        if release["draft"] or release["prerelease"]:
            continue
        if not release["tag_name"].startswith(source.get("tag_prefix", "")):
            continue
        releases += 1
        asset_url = api + "/" + str(release["id"]) + "/assets"
        for asset in paginated(asset_url, fetch):
            if not fnmatchcase(asset["name"], source.get("asset_pattern", "*")):
                continue
            if asset["id"] in assets:
                raise ValueError("Duplicate asset; refusing an ambiguous count")
            assets.add(asset["id"])
            total += nonnegative(asset["download_count"])
    if not releases:
        raise ValueError("No matching published releases")
    return {
        "value": total, "period": "available-release-assets",
        "asset_count": len(assets), "release_count": releases,
        "url": "https://github.com/" + source["repository"] + "/releases",
    }


def refresh(records, cache, fetch=fetch_json, now=None):
    now = now or datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    updated, failures = {}, []
    for record in records:
        for source in record["meta"].get("download_sources", []):
            key = record["meta"]["id"] + ":" + source["id"]
            old = cache.get(key, {})
            snapshot = old.copy() if old.get("source") == source else {"source": source.copy()}
            try:
                # PyPI Stats updates daily and asks clients to cache requests.
                if source["provider"] == "pypistats" and snapshot.get("last_attempt_at", "")[:10] == now[:10]:
                    updated[key] = snapshot
                    if snapshot.get("fetch_error"):
                        failures.append(key + ": " + snapshot["fetch_error"])
                    continue
                snapshot = {
                    "source": source.copy(), **collect(source, fetch),
                    "fetched_at": now, "last_attempt_at": now, "fetch_error": None,
                }
            except HTTPError as exc:
                snapshot.update(last_attempt_at=now, fetch_error="HTTP " + str(exc.code))
            except (URLError, TimeoutError, OSError):
                snapshot.update(last_attempt_at=now, fetch_error="Network request failed")
            except (KeyError, TypeError, ValueError, AttributeError):
                snapshot.update(last_attempt_at=now, fetch_error="Invalid or incomplete provider response")
            updated[key] = snapshot
            if snapshot.get("fetch_error"):
                failures.append(key + ": " + snapshot["fetch_error"])
    return dict(sorted(updated.items())), failures


def main():
    from catalog import ROOT, load_catalog

    parser = argparse.ArgumentParser(description=__doc__)
    parser.parse_args()
    _, records = load_catalog()
    path = ROOT / "data/download-stats.json"
    previous = json.loads(path.read_text()) if path.exists() else {}
    snapshots, failures = refresh(records, previous)
    path.write_text(json.dumps(snapshots, ensure_ascii=False, indent=2) + "\n")
    for failure in failures:
        print("Warning: " + failure, file=sys.stderr)
    print("Updated", len(snapshots), "download source snapshots.")
    return int(bool(failures))


if __name__ == "__main__":
    raise SystemExit(main())
