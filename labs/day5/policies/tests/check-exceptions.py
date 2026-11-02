#!/usr/bin/env python3
"""Checks every exception request in exceptions/ before anyone reviews it.

An exception must say who asked, why, and until when; it may last at most
MAX_DAYS; and it may only cover workloads in team namespaces. An exception whose
date has passed is reported but allowed: that is how a team ends one early (set
the date to yesterday), and the platform never applies it. Run it the way the
pipeline does:

    python3 tests/check-exceptions.py
"""

import datetime
import pathlib
import re
import sys

import yaml

MAX_DAYS = 30
NAMESPACE = sys.argv[1] if len(sys.argv) > 1 else "pelab-exceptions"
TEAM_NAMESPACE = re.compile(r"^team[0-9]{2}-(dev|staging|prod)$")


def problems(doc, today):
    meta = doc.get("metadata") or {}
    notes = meta.get("annotations") or {}
    found = []
    if doc.get("kind") != "PolicyException":
        return ["is not a PolicyException"]
    if meta.get("namespace") != NAMESPACE:
        found.append(f"metadata.namespace must be {NAMESPACE}")
    for key in ("pelab.io/requested-by", "pelab.io/reason", "pelab.io/expires"):
        if not str(notes.get(key, "")).strip():
            found.append(f"annotation {key} is missing")
    expires = str(notes.get("pelab.io/expires", ""))
    try:
        day = datetime.date.fromisoformat(expires)
    except ValueError:
        if expires:
            found.append(f"pelab.io/expires must be a date like 2026-11-03, not {expires!r}")
    else:
        if (day - today).days > MAX_DAYS:
            found.append(f"expires {day}: at most {MAX_DAYS} days ahead ({today + datetime.timedelta(MAX_DAYS)})")
    rules = (doc.get("spec") or {}).get("exceptions") or []
    if not rules:
        found.append("spec.exceptions must name the policy and rules")
    matches = ((doc.get("spec") or {}).get("match") or {}).get("any") or []
    for entry in matches:
        namespaces = (entry.get("resources") or {}).get("namespaces") or []
        if not namespaces:
            found.append("every match must list the team namespaces it covers")
        for namespace in namespaces:
            if not TEAM_NAMESPACE.match(str(namespace)):
                found.append(f"namespace {namespace} is not a team namespace")
    if not matches:
        found.append("spec.match must say which workloads it covers")
    return found


def main():
    today = datetime.date.today()
    files = sorted(pathlib.Path("exceptions").glob("*.yaml"))
    failed = False
    for path in files:
        for doc in yaml.safe_load_all(path.read_text()):
            if not doc:
                continue
            name = (doc.get("metadata") or {}).get("name", "?")
            issues = problems(doc, today)
            if issues:
                failed = True
                print(f"FAIL {path} ({name}):")
                for issue in issues:
                    print(f"  - {issue}")
            else:
                expires = str(doc["metadata"]["annotations"]["pelab.io/expires"])
                if datetime.date.fromisoformat(expires) < today:
                    print(f"ended {path} ({name}), on {expires}: the platform no longer applies it")
                else:
                    print(f"ok   {path} ({name}), until {expires}")
    if not files:
        print("No exception requests.")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
