#!/bin/bash
# Download and install the Pulsewatch RPM on Rocky / Alma / RHEL / Fedora.
#   curl -fL -O https://github.com/klye-guy/pulse_watch/releases/download/v1.0.0/install-el.sh
#   sudo bash install-el.sh
set -euo pipefail

VERSION="1.0.0"
RELEASE="6"
TAG="v${VERSION}"
RPM="pulsewatch-${VERSION}-${RELEASE}.noarch.rpm"
BASE="https://github.com/klye-guy/pulse_watch/releases/download/${TAG}"

if [[ ${EUID} -ne 0 ]]; then
  echo "Run as root: sudo bash $0" >&2
  exit 1
fi

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required" >&2
  exit 1
fi

workdir="$(mktemp -d)"
trap 'rm -rf "${workdir}"' EXIT
cd "${workdir}"

echo "==> Downloading ${RPM}"
# -f: fail on HTTP errors (so we never save an HTML 404 as .rpm)
# -L: follow GitHub's redirect to the actual binary
curl -fL --retry 3 --retry-delay 2 -o "${RPM}" "${BASE}/${RPM}"
curl -fL --retry 3 -o SHA256SUMS "${BASE}/SHA256SUMS"

echo "==> Verifying"
python3 - "${RPM}" <<'PY'
import sys
path = sys.argv[1]
data = open(path, "rb").read(8)
if data[:4] != b"\xed\xab\xee\xdb":
    sys.stderr.write(
        "Downloaded file is not an RPM (often an HTML error page).\n"
        "Use curl -fL, not dnf install https://github.com/...\n"
    )
    sys.exit(1)
print("RPM magic ok")
PY
grep " ${RPM}\$" SHA256SUMS | sha256sum -c -

if command -v dnf >/dev/null 2>&1; then
  dnf install -y "./${RPM}"
elif command -v yum >/dev/null 2>&1; then
  yum install -y "./${RPM}"
else
  echo "dnf/yum not found" >&2
  exit 1
fi

echo
echo "Pulsewatch RPM installed."
echo "Create the owner:  sudo pulsectl user add admin@company.com --name Admin --role owner"
echo "UI:                http://<this-host>:3000"
