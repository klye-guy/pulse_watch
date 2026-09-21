#!/bin/bash
# Pulsewatch installer for Ubuntu and Rocky Linux (source tree / tarball).
#   sudo bash packaging/install.sh
# Native packages (.deb / .rpm) run packaging/linux/configure-instance.sh from postinst instead.
set -euo pipefail

if [[ ${EUID} -ne 0 ]]; then
  echo "Run as root: sudo bash packaging/install.sh" >&2
  exit 1
fi

APP_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
INSTALL_DIR="${PULSEWATCH_HOME:-/opt/pulsewatch}"

detect_os() {
  if [[ -f /etc/os-release ]]; then
    # shellcheck disable=SC1091
    . /etc/os-release
    echo "${ID}"
  else
    echo "unknown"
  fi
}

install_packages() {
  local os
  os="$(detect_os)"
  echo "Detected OS: ${os}"
  case "${os}" in
    ubuntu | debian)
      apt-get update -y
      apt-get install -y ca-certificates curl xz-utils postgresql postgresql-contrib
      ;;
    rocky | rhel | almalinux | centos | fedora)
      dnf install -y ca-certificates curl xz postgresql-server postgresql
      ;;
    *)
      echo "Unsupported distro '${os}'. Install curl, xz, and PostgreSQL, then re-run." >&2
      exit 1
      ;;
  esac
}

install_app() {
  mkdir -p "${INSTALL_DIR}"
  tar -C "${APP_ROOT}" \
    --exclude node_modules \
    --exclude .git \
    --exclude screenshots \
    --exclude artifacts \
    --exclude dist \
    --exclude .output \
    --exclude public/releases \
    --exclude packaging/linux/staging \
    -cf - . | tar -C "${INSTALL_DIR}" -xf -
  chmod +x "${INSTALL_DIR}/packaging/linux/configure-instance.sh"
}

echo "==> Installing Pulsewatch from source"
install_packages
install_app
exec bash "${INSTALL_DIR}/packaging/linux/configure-instance.sh"
