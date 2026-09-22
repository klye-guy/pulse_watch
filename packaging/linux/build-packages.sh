#!/bin/bash
# Build the source tarball plus .deb and .rpm packages.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "${HERE}/../.." && pwd)"
VERSION="$(tr -d '[:space:]' < "${HERE}/version")"
RELEASE="7"
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

log "Staging source (v${VERSION}-${RELEASE})"
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
  "${STAGE}/packaging/linux/install-el.sh" \
  "${STAGE}/packaging/linux/posttrans.sh" \
  "${STAGE}/bin/pulsectl.mjs"

TAR_NAME="pulsewatch-${VERSION}"
DEB_NAME="pulsewatch_${VERSION}-${RELEASE}_all.deb"
RPM_NAME="pulsewatch-${VERSION}-${RELEASE}.noarch.rpm"
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
  cp "${HERE}/install-el.sh" install-el.sh
  chmod +x install-el.sh
  sha256sum "${TAR_NAME}.tar.gz" "${DEB_NAME}" "${RPM_NAME}" install-el.sh > SHA256SUMS
  cp "${ROOT}/INSTALL.md" INSTALL.md
  cat > README.txt <<EOF
Pulsewatch ${VERSION}-${RELEASE} Linux packages

  Rocky / Alma / RHEL / Fedora — download then install from the local file.
  Do not pass the GitHub URL to dnf (it often saves an HTML page as .rpm).

      curl -fL -O https://github.com/klye-guy/pulse_watch/releases/download/v${VERSION}/${RPM_NAME}
      sudo dnf install ./${RPM_NAME}

  Or run the helper (verifies RPM magic + sha256):

      curl -fL -O https://github.com/klye-guy/pulse_watch/releases/download/v${VERSION}/install-el.sh
      sudo bash install-el.sh

  Ubuntu / Debian:

      sudo apt-get update
      sudo apt install ./${DEB_NAME}

  Source tarball (works on Rocky if the RPM will not load):

      tar -xzf ${TAR_NAME}.tar.gz
      cd ${TAR_NAME}
      sudo bash packaging/install.sh

Then:
  sudo pulsectl user add admin@company.com --name Admin --role owner
  Open http://<this-host>:3000

Verify:
  sha256sum -c SHA256SUMS
EOF
)

# One-file bundle for transferring to a VM
BUNDLE_NAME="pulsewatch-${VERSION}-linux-packages.tar.gz"
log "Writing ${DIST}/${BUNDLE_NAME}"
(
  cd "${DIST}"
  tar -czf "${BUNDLE_NAME}" \
    "${TAR_NAME}.tar.gz" \
    "${DEB_NAME}" \
    "${RPM_NAME}" \
    install-el.sh \
    SHA256SUMS \
    README.txt \
    INSTALL.md
  sha256sum "${BUNDLE_NAME}" >> SHA256SUMS
)

# Preview / in-app downloads
rm -rf "${PUBLIC}"
mkdir -p "${PUBLIC}"
cp -a "${DIST}/." "${PUBLIC}/"

log "Artifacts:"
ls -lh "${DIST}"
echo
cat "${DIST}/SHA256SUMS"
