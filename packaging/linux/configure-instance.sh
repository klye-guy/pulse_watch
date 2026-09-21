#!/bin/bash
# Idempotent first-boot / upgrade configuration for Pulsewatch.
# Assumes application files already live in /opt/pulsewatch.
# Safe to re-run. Never overwrites an existing /etc/pulsewatch/pulsewatch.env.
set -euo pipefail

INSTALL_DIR="${PULSEWATCH_HOME:-/opt/pulsewatch}"
ENV_FILE="/etc/pulsewatch/pulsewatch.env"
SERVICE_USER="pulsewatch"
PORT="${PULSEWATCH_PORT:-3000}"
NODE_VERSION="${PULSEWATCH_NODE_VERSION:-22.23.2}"
LOG_FILE="/var/log/pulsewatch-install.log"

mkdir -p "$(dirname "${LOG_FILE}")"

log() {
  local msg="==> $*"
  echo "${msg}"
  echo "${msg}" >> "${LOG_FILE}"
}

if [[ ${EUID} -ne 0 ]]; then
  echo "configure-instance.sh must run as root" >&2
  exit 1
fi

export PATH="/usr/sbin:/usr/bin:/sbin:/bin:${PATH:-}"
export LANG="${LANG:-C.UTF-8}"
export LC_ALL="${LC_ALL:-${LANG}}"

# Halt the systemd crash-loop if the unit was enabled before setup finished.
if command -v systemctl >/dev/null 2>&1; then
  systemctl stop pulsewatch.service >/dev/null 2>&1 || true
  systemctl reset-failed pulsewatch.service >/dev/null 2>&1 || true
fi

detect_os() {
  if [[ -f /etc/os-release ]]; then
    # shellcheck disable=SC1091
    . /etc/os-release
    echo "${ID}"
  else
    echo "unknown"
  fi
}

run_as() {
  local user="$1"
  shift
  if command -v runuser >/dev/null 2>&1; then
    runuser -u "${user}" -- "$@"
  else
    su -s /bin/bash "${user}" -c "$(printf '%q ' "$@")"
  fi
}

node_major() {
  local bin="$1"
  [[ -x "${bin}" ]] || return 1
  "${bin}" -p "process.versions.node.split('.')[0]" 2>/dev/null || return 1
}

ensure_node() {
  local system_node=""
  if command -v node >/dev/null 2>&1; then
    system_node="$(command -v node)"
  fi
  if [[ -n "${system_node}" ]]; then
    local major
    major="$(node_major "${system_node}" || echo 0)"
    if [[ "${major}" -ge 20 ]] && command -v npm >/dev/null 2>&1; then
      log "Using system Node.js v$("${system_node}" -v | tr -d 'v') at ${system_node}"
      return 0
    fi
    log "System Node.js is too old or npm is missing — installing Node ${NODE_VERSION} under ${INSTALL_DIR}/runtime"
  else
    log "Node.js not on PATH — installing Node ${NODE_VERSION} under ${INSTALL_DIR}/runtime"
  fi

  if ! command -v curl >/dev/null 2>&1; then
    echo "curl is required to download Node.js ${NODE_VERSION}" >&2
    exit 1
  fi

  local arch node_arch tarball url tmp
  arch="$(uname -m)"
  case "${arch}" in
    x86_64 | amd64) node_arch="x64" ;;
    aarch64 | arm64) node_arch="arm64" ;;
    *)
      echo "Unsupported CPU architecture '${arch}'. Install Node.js 22+ and re-run." >&2
      exit 1
      ;;
  esac

  tarball="node-v${NODE_VERSION}-linux-${node_arch}.tar.xz"
  url="https://nodejs.org/dist/v${NODE_VERSION}/${tarball}"
  tmp="$(mktemp -d)"
  log "Downloading ${url}"
  curl -fsSL --retry 3 --retry-delay 2 -o "${tmp}/${tarball}" "${url}"
  curl -fsSL --retry 3 -o "${tmp}/SHASUMS256.txt" "https://nodejs.org/dist/v${NODE_VERSION}/SHASUMS256.txt"
  (
    cd "${tmp}"
    grep " ${tarball}\$" SHASUMS256.txt | sha256sum -c -
  )
  tar -xJf "${tmp}/${tarball}" -C "${tmp}"
  rm -rf "${INSTALL_DIR}/runtime"
  mv "${tmp}/node-v${NODE_VERSION}-linux-${node_arch}" "${INSTALL_DIR}/runtime"
  rm -rf "${tmp}"
  log "Node $("${INSTALL_DIR}/runtime/bin/node" -v) installed to ${INSTALL_DIR}/runtime"
}

node_bin() {
  if [[ -x "${INSTALL_DIR}/runtime/bin/node" ]]; then
    echo "${INSTALL_DIR}/runtime/bin/node"
  else
    command -v node
  fi
}

npm_bin() {
  if [[ -x "${INSTALL_DIR}/runtime/bin/npm" ]]; then
    echo "${INSTALL_DIR}/runtime/bin/npm"
  else
    command -v npm
  fi
}

wait_for_postgres() {
  local i psql_bin
  psql_bin="$(command -v psql || true)"
  [[ -n "${psql_bin}" ]] || psql_bin="/usr/bin/psql"
  for i in $(seq 1 60); do
    if command -v pg_isready >/dev/null 2>&1 && pg_isready -q; then
      if run_as postgres "${psql_bin}" -d postgres -Atqc 'select 1' >/dev/null 2>&1; then
        return 0
      fi
    elif run_as postgres "${psql_bin}" -d postgres -Atqc 'select 1' >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  log "PostgreSQL did not become ready"
  systemctl status postgresql postgresql-16 postgresql-15 postgresql-13 --no-pager 2>/dev/null || true
  return 1
}

pg_unit() {
  local f name
  for name in postgresql postgresql-17 postgresql-16 postgresql-15 postgresql-14 postgresql-13 postgresql-12; do
    if [[ -f "/usr/lib/systemd/system/${name}.service" ]] || [[ -f "/etc/systemd/system/${name}.service" ]]; then
      echo "${name}"
      return 0
    fi
  done
  for f in /usr/lib/systemd/system/postgresql*.service; do
    [[ -e "${f}" ]] || continue
    basename "${f}" .service
    return 0
  done
  return 1
}

pg_setup_bin() {
  local b
  for b in postgresql-setup postgresql-17-setup postgresql-16-setup postgresql-15-setup postgresql-14-setup postgresql-13-setup; do
    if command -v "${b}" >/dev/null 2>&1; then
      command -v "${b}"
      return 0
    fi
  done
  [[ -x /usr/bin/postgresql-setup ]] && echo /usr/bin/postgresql-setup && return 0
  return 1
}

cluster_initialized() {
  local d
  for d in /var/lib/pgsql/data /var/lib/pgsql/*/data /var/lib/pgsql/*/data/base; do
    if [[ -f "${d}/PG_VERSION" ]] || [[ -f "${d}/../PG_VERSION" && "${d}" == */base ]]; then
      return 0
    fi
  done
  [[ -f /var/lib/pgsql/data/PG_VERSION ]]
}

ensure_postgres_packages() {
  if id -u postgres >/dev/null 2>&1 && command -v psql >/dev/null 2>&1 && command -v postgres >/dev/null 2>&1; then
    return 0
  fi
  # Only the server binary is strictly required; psql comes from the client package.
  if id -u postgres >/dev/null 2>&1 && [[ -x /usr/bin/postgres || -x /usr/bin/psql ]]; then
    if command -v psql >/dev/null 2>&1; then
      return 0
    fi
  fi
  log "PostgreSQL packages missing — installing"
  local os
  os="$(detect_os)"
  case "${os}" in
    ubuntu | debian)
      if ! apt-get install -y postgresql postgresql-contrib; then
        log "apt could not install postgresql (dpkg may be locked during package setup)."
        return 1
      fi
      ;;
    rocky | rhel | almalinux | centos | fedora)
      if ! dnf install -y postgresql-server postgresql; then
        log "dnf could not install postgresql-server (rpm db may be locked during package setup)."
        log "After this script, run:  sudo dnf install -y postgresql-server postgresql && sudo bash $0"
        return 1
      fi
      ;;
    *)
      return 1
      ;;
  esac
}

fix_pg_hba() {
  local hba psql_bin
  psql_bin="$(command -v psql || echo /usr/bin/psql)"
  hba="$(run_as postgres "${psql_bin}" -d postgres -Atqc 'show hba_file' 2>/dev/null || true)"
  if [[ -z "${hba}" || ! -f "${hba}" ]]; then
    for hba in /var/lib/pgsql/data/pg_hba.conf /var/lib/pgsql/*/data/pg_hba.conf; do
      [[ -f "${hba}" ]] && break
    done
  fi
  if [[ ! -f "${hba}" ]]; then
    log "Could not find pg_hba.conf — password auth may fail on 127.0.0.1"
    return 0
  fi
  if grep -q 'Pulsewatch local password auth' "${hba}"; then
    return 0
  fi
  log "Allowing password auth for pulsewatch on localhost (${hba})"
  cp -a "${hba}" "${hba}.pulsewatch.bak"
  local tmp
  tmp="$(mktemp)"
  cat > "${tmp}" <<'HBA'
# Pulsewatch local password auth
local   pulsewatch      pulsewatch                              scram-sha-256
host    pulsewatch      pulsewatch      127.0.0.1/32            scram-sha-256
host    pulsewatch      pulsewatch      ::1/128                 scram-sha-256
host    all             all             127.0.0.1/32            scram-sha-256
host    all             all             ::1/128                 scram-sha-256
HBA
  cat "${hba}" >> "${tmp}"
  mv "${tmp}" "${hba}"
  chown postgres:postgres "${hba}"
  chmod 600 "${hba}"
  local unit
  unit="$(pg_unit || echo postgresql)"
  systemctl reload "${unit}" >/dev/null 2>&1 || systemctl restart "${unit}"
}

ensure_postgres_cluster() {
  ensure_postgres_packages || true
  if ! id -u postgres >/dev/null 2>&1; then
    echo "The postgres system user is missing. Install PostgreSQL:" >&2
    echo "  sudo dnf install -y postgresql-server postgresql" >&2
    echo "  sudo bash ${INSTALL_DIR}/packaging/linux/configure-instance.sh" >&2
    exit 1
  fi
  if ! command -v psql >/dev/null 2>&1 && [[ ! -x /usr/bin/psql ]]; then
    echo "psql is missing. Install the client:  sudo dnf install -y postgresql" >&2
    exit 1
  fi

  local unit setup
  unit="$(pg_unit || true)"
  setup="$(pg_setup_bin || true)"

  if ! cluster_initialized; then
    log "Initializing PostgreSQL cluster"
    if [[ -n "${setup}" ]]; then
      if ! "${setup}" --initdb; then
        "${setup}" initdb || true
      fi
    else
      echo "postgresql-setup not found. Install postgresql-server." >&2
      exit 1
    fi
    if ! cluster_initialized; then
      echo "PostgreSQL initdb did not create a data directory. See /var/log/pulsewatch-install.log" >&2
      exit 1
    fi
  else
    log "PostgreSQL cluster already initialized"
  fi

  if [[ -z "${unit}" ]]; then
    unit="postgresql"
  fi
  log "Starting ${unit}"
  systemctl enable "${unit}"
  if ! systemctl start "${unit}"; then
    log "systemctl start ${unit} failed"
    journalctl -u "${unit}" -n 50 --no-pager || true
    exit 1
  fi
  if ! wait_for_postgres; then
    echo "PostgreSQL did not become ready. Check: journalctl -u ${unit} -e" >&2
    exit 1
  fi
  fix_pg_hba
}

ensure_db() {
  ensure_postgres_cluster
  if [[ -f "${ENV_FILE}" ]] && grep -q '^DATABASE_URL=' "${ENV_FILE}"; then
    log "Keeping existing database credentials in ${ENV_FILE}"
    return 0
  fi
  local pass sql psql_bin
  psql_bin="$(command -v psql || echo /usr/bin/psql)"
  pass="$(tr -dc 'A-Za-z0-9' </dev/urandom | head -c 28)"
  sql="$(mktemp)"
  cat > "${sql}" <<SQL
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
  log "Creating role and database 'pulsewatch'"
  run_as postgres "${psql_bin}" -v ON_ERROR_STOP=1 -d postgres -f "${sql}"
  rm -f "${sql}"
  PULSEWATCH_GENERATED_DB_PASS="${pass}"
  export PULSEWATCH_GENERATED_DB_PASS
}

ensure_user() {
  if ! id -u "${SERVICE_USER}" >/dev/null 2>&1; then
    local shell="/usr/sbin/nologin"
    [[ -x "${shell}" ]] || shell="/sbin/nologin"
    [[ -x "${shell}" ]] || shell="/bin/false"
    useradd --system --home "${INSTALL_DIR}" --shell "${shell}" "${SERVICE_USER}"
  fi
  mkdir -p "${INSTALL_DIR}" /etc/pulsewatch /var/lib/pulsewatch
  chown -R "${SERVICE_USER}:${SERVICE_USER}" "${INSTALL_DIR}" /var/lib/pulsewatch
  chown root:"${SERVICE_USER}" /etc/pulsewatch
  chmod 750 /etc/pulsewatch
}

write_env() {
  if [[ -f "${ENV_FILE}" ]]; then
    log "Keeping existing ${ENV_FILE}"
    chmod 640 "${ENV_FILE}" || true
    chown root:"${SERVICE_USER}" "${ENV_FILE}" || true
    return 0
  fi
  local secret db_pass
  secret="$(tr -dc 'A-Za-z0-9' </dev/urandom | head -c 48)"
  db_pass="${PULSEWATCH_GENERATED_DB_PASS:-}"
  if [[ -z "${db_pass}" ]]; then
    echo "internal error: database password missing" >&2
    exit 1
  fi
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
  log "Wrote ${ENV_FILE}"
}

build_app() {
  local npm node node_dir
  npm="$(npm_bin)"
  node="$(node_bin)"
  node_dir="$(dirname "${node}")"
  if [[ -f "${INSTALL_DIR}/.output/server/index.mjs" && -d "${INSTALL_DIR}/node_modules/pg" && "${PULSEWATCH_FORCE_BUILD:-}" != "1" ]]; then
    log "Build already present — skipping npm ci (set PULSEWATCH_FORCE_BUILD=1 to rebuild)"
    return 0
  fi
  log "Installing npm dependencies (first install takes a few minutes)"
  chmod +x "${INSTALL_DIR}/bin/pulsectl.mjs" "${INSTALL_DIR}/packaging/linux/"* || true
  chown -R "${SERVICE_USER}:${SERVICE_USER}" "${INSTALL_DIR}" /var/lib/pulsewatch
  if command -v restorecon >/dev/null 2>&1; then
    restorecon -Rv "${INSTALL_DIR}" /var/lib/pulsewatch >/dev/null 2>&1 || true
  fi

  run_as "${SERVICE_USER}" env \
    HOME=/var/lib/pulsewatch \
    npm_config_cache=/var/lib/pulsewatch/.npm \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    PUPPETEER_SKIP_DOWNLOAD=1 \
    PATH="${node_dir}:${PATH}" \
    "${npm}" --prefix "${INSTALL_DIR}" ci --no-audit --no-fund --loglevel=error

  log "Building production server"
  run_as "${SERVICE_USER}" env \
    HOME=/var/lib/pulsewatch \
    npm_config_cache=/var/lib/pulsewatch/.npm \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    PATH="${node_dir}:${PATH}" \
    PULSEWATCH_SELFHOST=1 \
    NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=1536}" \
    bash -c "set -a; . '${ENV_FILE}'; set +a; cd '${INSTALL_DIR}'; '${npm}' run build"

  if [[ ! -f "${INSTALL_DIR}/.output/server/index.mjs" ]]; then
    echo "Build did not produce ${INSTALL_DIR}/.output/server/index.mjs" >&2
    exit 1
  fi
  log "Build complete"
}

install_cli_and_unit() {
  install -m 755 "${INSTALL_DIR}/packaging/linux/pulsewatch-server" "${INSTALL_DIR}/bin/pulsewatch-server"
  if [[ -f "${INSTALL_DIR}/packaging/linux/pulsectl" ]]; then
    install -m 755 "${INSTALL_DIR}/packaging/linux/pulsectl" /usr/bin/pulsectl
  fi
  if [[ -f "${INSTALL_DIR}/packaging/pulsewatch.service" ]]; then
    mkdir -p /usr/lib/systemd/system
    install -m 644 "${INSTALL_DIR}/packaging/pulsewatch.service" /usr/lib/systemd/system/pulsewatch.service
  fi
  chown "${SERVICE_USER}:${SERVICE_USER}" "${INSTALL_DIR}/bin/pulsewatch-server"
}

enable_service() {
  if ! command -v systemctl >/dev/null 2>&1; then
    log "systemd not found — skip enabling the unit"
    return 0
  fi
  systemctl daemon-reload
  systemctl enable pulsewatch.service
  if ! systemctl restart pulsewatch.service && ! systemctl start pulsewatch.service; then
    log "pulsewatch.service failed to start"
    systemctl status pulsewatch.service --no-pager || true
    journalctl -u pulsewatch -n 50 --no-pager || true
    echo "See /var/log/pulsewatch-install.log and: journalctl -u pulsewatch -e" >&2
    exit 1
  fi
  log "systemd unit pulsewatch is enabled"
}

log "Configuring Pulsewatch in ${INSTALL_DIR}"
ensure_user
ensure_node
ensure_db
write_env
build_app
install_cli_and_unit
enable_service

echo
echo "Pulsewatch is installed."
echo "  URL:  http://<this-host>:${PORT}"
echo "  Logs: journalctl -u pulsewatch -f"
echo "Create the first owner if you have not signed in yet:"
echo "  sudo pulsectl user add admin@example.com --name Admin --role owner"
echo
