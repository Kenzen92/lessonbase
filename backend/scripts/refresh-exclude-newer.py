#!/usr/bin/env python3
"""Update uv.toml exclude-newer to today - 7 days before a dependency update session."""
import re
from datetime import datetime, timezone, timedelta
from pathlib import Path

TOML = Path(__file__).parent.parent / "uv.toml"
cutoff = datetime.now(timezone.utc) - timedelta(days=7)
ts = cutoff.strftime("%Y-%m-%dT%H:%M:%SZ")

content = TOML.read_text(encoding="utf-8")
updated = re.sub(r'exclude-newer = "[^"]*"', f'exclude-newer = "{ts}"', content)
TOML.write_text(updated, encoding="utf-8")
print(f"exclude-newer → {ts}")
print("Now run: uv lock  (or  uv add <package>)")
