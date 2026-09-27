#!/bin/sh
set -e
sh -n scripts/deploy.sh
./scripts/deploy.sh help > /dev/null
echo "deploy.sh syntax and help command verified"
