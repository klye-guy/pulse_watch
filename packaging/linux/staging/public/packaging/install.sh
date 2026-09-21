#!/bin/bash
# Pulsewatch installer for Ubuntu and Rocky Linux.
# Run from the extracted application directory:
#   sudo bash packaging/install.sh
set -euo pipefail

if [[ ${EUID} -ne 0 ]]; then
  echo "Run as root: sudo bash packaging/install.sh" >&2
  exit 1
fi

APP_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
INSTALL_DIR="${PULSEWATCH_HOME:-/opt/pulsewatch}"
ENV_FILE="/etc/pulsewatch/pulsewatch.env"
SERVICE_USER="pulsewatch"
PORT="${PULSEWATCH_PORT:-3000}"

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
    ubuntu|debian)
      apt-get update -y
      apt-get install -y ca-certificates curl gnupg postgresql postgresql-contrib
      if ! command -v node >/dev/null 2>&1 || [[ "$(node -v | sed 's/v//' | cut -d. -f1)" -lt 22 ]]; then
        curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
        apt-get install -y nodejs
      fi
      systemctl enable --now postgresql
      ;;
    rocky|rhel|almalinux|centos|fedora)
      dnf install -y ca-certificates curl postgresql-server postgresql postgresql-contrib
      if ! command -v node >/dev/null 2>&1; then
        dnf module enable -y nodejs:22 || true
        dnf install -y nodejs || {
          curl -fsSL https://rpm.nodesource.com/setup_22.x | bash -
          dnf install -y nodejs
        }
      fi
      if [[ ! -f /var/lib/pgsql/data/PG_VERSION ]]; then
        postgresql-setup --initdb || /usr/bin/postgresql-setup --initdb || true
      fi
      systemctl enable --now postgresql
      ;;
    *)
      echo "Unsupported distro '${os}'. Install Node.js 22 and PostgreSQL, then re-run." >&2
      exit 1
      ;;
  esac
}

ensure_db() {
  local pass
  pass="$(tr -dc 'A-Za-z0-9' </dev/urandom | head -c 24)"
  if ! id -u postgres >/dev/null 2>&1; then
    echo "postgres system user missing" >&2
    exit 1
  fi
  sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'pulsewatch') THEN
    CREATE ROLE pulsewatch LOGIN PASSWORD '${pass}';
  ELSE
    ALTER ROLE pulsewatch PASSWORD '${pass}';
  END IF;
END
\$\$;
SELECT 'CREATE DATABASE pulsewatch OWNER pulsewatch'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'pulsewatch')\\gexec
SQL
  echo "${pass}"
}

install_app() {
  id -u "${SERVICE_USER}" >/dev/null 2>&1 || useradd --system --home "${INSTALL_DIR}" --shell /usr/sbin/nologin "${SERVICE_USER}"
  mkdir -p "${INSTALL_DIR}" /etc/pulsewatch /var/lib/pulsewatch
  tar -C "${APP_ROOT}" --exclude node_modules --exclude .git --exclude screenshots --exclude artifacts --exclude dist --exclude .output -cf - . \
    | tar -C "${INSTALL_DIR}" -xf -
  chown -R "${SERVICE_USER}:${SERVICE_USER}" "${INSTALL_DIR}" /var/lib/pulsewatch
}

write_env() {
  local db_pass="$1"
  if [[ -f "${ENV_FILE}" ]]; then
    echo "Keeping existing ${ENV_FILE}"
    return
  fi
  local secret
  secret="$(tr -dc 'A-Za-z0-9' </dev/urandom | head -c 48)"
  cat > "${ENV_FILE}" <<ENV
NODE_ENV=production
PORT=${PORT}
HOST=0.0.0.0
PULSEWATCH_SELFHOST=1
VITE_AUTH_ENABLED=true
CHECK_CONCURRENCY=48
CHECK_HOST_CONCURRENCY=6
PG_POOL_MAX=20
DATABASE_URL=postgres://pulsewatch:${db_pass}@127.0.0.1:5432/pulsewatch
BETTER_AUTH_SECRET=${secret}
BETTER_AUTH_URL=http://127.0.0.1:${PORT}
ENV
  chmod 640 "${ENV_FILE}"
  chown root:"${SERVICE_USER}" "${ENV_FILE}"
}

build_app() {
  cd "${INSTALL_DIR}"
  sudo -u "${SERVICE_USER}" -H bash -lc 'npm ci'
  sudo -u "${SERVICE_USER}" -H bash -lc 'set -a; . /etc/pulsewatch/pulsewatch.env; set +a; PULSEWATCH_SELFHOST=1 npm run build'
}

install_unit() {
  install -m 644 "${APP_ROOT}/packaging/pulsewatch.service" /etc/systemd/system/pulsewatch.service
  install -m 755 "${APP_ROOT}/bin/pulsectl.mjs" /usr/local/bin/pulsectl
  # Wrapper so pulsectl is invoked with node even if the shebang host differs.
  cat > /usr/local/bin/pulsectl <<'WRAP'
#!/bin/bash
exec /usr/bin/node /opt/pulsewatch/bin/pulsectl.mjs "$@"
WRAP
  chmod 755 /usr/local/bin/pulsectl
  cp "${APP_ROOT}/bin/pulsectl.mjs" "${INSTALL_DIR}/bin/pulsectl.mjs"
  systemctl daemon-reload
  systemctl enable --now pulsewatch
}

echo "==> Installing Pulsewatch"
install_packages
DB_PASS="$(ensure_db)"
install_app
write_env "${DB_PASS}"
build_app
install_unit

echo
echo "Pulsewatch is running as systemd unit 'pulsewatch' on port ${PORT}."
echo "Create the first owner (if you have not signed in yet):"
echo "  sudo pulsectl user add admin@example.com --name Admin --role owner"
echo "Logs: journalctl -u pulsewatch -f"
