#!/bin/bash
# RPM %posttrans — rpmdb is unlocked here, so we can install PostgreSQL if
# the original transaction used `rpm -i` (which skips Requires) or if %post
# ran before the cluster existed.
set -euo pipefail
SCRIPT="/opt/pulsewatch/packaging/linux/configure-instance.sh"
MARKER="/opt/pulsewatch/.output/server/index.mjs"
if [[ -f "${MARKER}" ]]; then
  exit 0
fi
if [[ ! -x "${SCRIPT}" ]]; then
  exit 0
fi
exec "${SCRIPT}"
