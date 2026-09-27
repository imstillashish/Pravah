#!/bin/sh
set -e
# Test syntax and help
sh -n scripts/keep_alive.sh
# Test --once mode against mock or dummy URL with dry run check
./scripts/keep_alive.sh "http://127.0.0.1:9999" 1 --dry-run
echo "keep_alive tests passed"
