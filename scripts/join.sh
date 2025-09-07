#!/usr/bin/env bash
set -euo pipefail
cat dist/SpiceSync.zip.part* > SpiceSync.zip
echo 'Wrote SpiceSync.zip'