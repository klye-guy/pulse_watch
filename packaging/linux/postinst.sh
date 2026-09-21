#!/bin/bash
# Debian postinst / RPM %post — payload is already unpacked to /opt/pulsewatch.
set -euo pipefail
SCRIPT="/opt/pulsewatch/packaging/linux/configure-instance.sh"
if [[ ! -x "${SCRIPT}" ]]; then
  chmod +x "${SCRIPT}" 2>/dev/null || true
fi
exec "${SCRIPT}"
