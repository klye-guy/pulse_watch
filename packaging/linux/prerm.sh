#!/bin/bash
# Stop the unit before files are removed or replaced.
set -e
if command -v systemctl >/dev/null 2>&1; then
  systemctl stop pulsewatch.service >/dev/null 2>&1 || true
fi
# Build artifacts are created in postinst and are not owned by the package.
if [[ -d /opt/pulsewatch ]]; then
  rm -rf /opt/pulsewatch/node_modules /opt/pulsewatch/.output /opt/pulsewatch/runtime
  rm -rf /opt/pulsewatch/.npm /var/lib/pulsewatch/.npm
fi
exit 0
