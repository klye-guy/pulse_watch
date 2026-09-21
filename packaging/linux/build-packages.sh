#!/bin/bash
# Build the source tarball plus .deb and .rpm packages.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "${HERE}/../.." && pwd)"
VERSION="$(tr -d '[:space:]' < "${HERE}/version")"
STAGE="${HERE}/staging"
DIST="${ROOT}/artifacts/releases"
PUBLIC="${ROOT}/public/releases"
NFPM_BIN="${NFPM_BIN:-}"

log() { echo "==> $*"; }

if [[ -z "${NFPM_BIN}" ]]; then
  if command -v nfpm >/dev/null 2>&1; then
    NFPM_BIN="$(command -v nfpm)"
  elif [[ -x /tmp/nfpm/nfpm ]]; then
    NFPM_BIN=/tmp/nfpm/nfpm
  else
    echo "nfpm not found. Set NFPM_BIN or place the binary at /tmp/nfpm/nfpm" >&2
    exit 1
  fi
fi

rm -rf "${STAGE}"
mkdir -p "${STAGE}" "${DIST}" "${PUBLIC}"

log "Staging source (v${VERSION})"
tar -C "${ROOT}" \
  --exclude-from="${HERE}/excludes.txt" \
  --exclude='packaging/linux/staging' \
  --exclude='packaging/linux/nfpm.gen.yaml' \
  --exclude='packaging/linux/.nfpm' \
  -cf - . | tar --no-same-owner -C "${STAGE}" -xf -

# Keep a tiny auth build flag so `npm run build` matches this workspace.
mkdir -p "${STAGE}/.grok"
if [[ -f "${ROOT}/.grok/app-env.json" ]]; then
  cp "${ROOT}/.grok/app-env.json" "${STAGE}/.grok/app-env.json"
else
  printf '%s\n' '{"deploy":{"database":true}}' > "${STAGE}/.grok/app-env.json"
fi

find "${STAGE}" -type d -exec chmod 755 {} +
find "${STAGE}" -type f -exec chmod 644 {} +
chmod +x \
  "${STAGE}/packaging/install.sh" \
  "${STAGE}/packaging/linux/configure-instance.sh" \
  "${STAGE}/packaging/linux/postinst.sh" \
  "${STAGE}/packaging/linux/prerm.sh" \
  "${STAGE}/packaging/linux/postrm.sh" \
  "${STAGE}/packaging/linux/pulsewatch-server" \
  "${STAGE}/packaging/linux/pulsectl" \
  "${STAGE}/packaging/linux/build-packages.sh" \
  "${STAGE}/bin/pulsectl.mjs"

TAR_NAME="pulsewatch-${VERSION}"
DEB_NAME="pulsewatch_${VERSION}-1_all.deb"
RPM_NAME="pulsewatch-${VERSION}-1.noarch.rpm"
TAR_DIR="$(mktemp -d)"
mkdir -p "${TAR_DIR}/${TAR_NAME}"
tar -C "${STAGE}" -cf - . | tar --no-same-owner -C "${TAR_DIR}/${TAR_NAME}" -xf -
log "Writing ${DIST}/${TAR_NAME}.tar.gz"
tar -C "${TAR_DIR}" -czf "${DIST}/${TAR_NAME}.tar.gz" "${TAR_NAME}"
rm -rf "${TAR_DIR}"

sed "s/\${VERSION}/${VERSION}/g" "${HERE}/nfpm.yaml" > "${HERE}/nfpm.gen.yaml"

log "Building .deb"
(cd "${HERE}" && "${NFPM_BIN}" pkg --packager deb --config nfpm.gen.yaml --target "${DIST}/${DEB_NAME}")
log "Building .rpm"
(cd "${HERE}" && "${NFPM_BIN}" pkg --packager rpm --config nfpm.gen.yaml --target "${DIST}/${RPM_NAME}")

rm -f "${HERE}/nfpm.gen.yaml"

(
  cd "${DIST}"
  sha256sum "${TAR_NAME}.tar.gz" "${DEB_NAME}" "${RPM_NAME}" > SHA256SUMS
  cat > README.txt <<EOF
Pulsewatch ${VERSION} Linux packages

  ${DEB_NAME}
      sudo apt-get update
      sudo apt install ./${DEB_NAME}

  ${RPM_NAME}
      sudo dnf install ./${RPM_NAME}

  ${TAR_NAME}.tar.gz
      tar -xzf ${TAR_NAME}.tar.gz
      cd ${TAR_NAME}
      sudo bash packaging/install.sh

Then:
  sudo pulsectl user add admin@company.com --name Admin --role owner

Verify:
  sha256sum -c SHA256SUMS
EOF
)

# Preview / in-app downloads
rm -rf "${PUBLIC}"
mkdir -p "${PUBLIC}"
cp -a "${DIST}/." "${PUBLIC}/"

log "Artifacts:"
ls -lh "${DIST}"
echo
cat "${DIST}/SHA256SUMS"
