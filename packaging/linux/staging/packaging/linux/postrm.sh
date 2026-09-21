#!/bin/bash
set -e
if command -v systemctl >/dev/null 2>&1; then
  systemctl daemon-reload >/dev/null 2>&1 || true
  systemctl reset-failed pulsewatch.service >/dev/null 2>&1 || true
fi
# Keep Postgres data and /etc/pulsewatch on remove. Only purge drops the env file.
if [[ "${1:-}" = "purge" ]]; then
  rm -f /etc/pulsewatch/pulsewatch.env
  rmdir /etc/pulsewatch 2>/dev/null || true
fi
exit 0
