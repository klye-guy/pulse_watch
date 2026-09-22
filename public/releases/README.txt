Pulsewatch 1.0.0-8 Linux packages

  Rocky / Alma / RHEL / Fedora — download then install from the local file.
  Do not pass the GitHub URL to dnf (it often saves an HTML page as .rpm).

      curl -fL -O https://github.com/klye-guy/pulse_watch/releases/download/v1.0.0/pulsewatch-1.0.0-8.noarch.rpm
      sudo dnf install ./pulsewatch-1.0.0-8.noarch.rpm

  Or run the helper (verifies RPM magic + sha256):

      curl -fL -O https://github.com/klye-guy/pulse_watch/releases/download/v1.0.0/install-el.sh
      sudo bash install-el.sh

  Ubuntu / Debian:

      sudo apt-get update
      sudo apt install ./pulsewatch_1.0.0-8_all.deb

  Source tarball (works on Rocky if the RPM will not load):

      tar -xzf pulsewatch-1.0.0.tar.gz
      cd pulsewatch-1.0.0
      sudo bash packaging/install.sh

Then:
  sudo pulsectl user add admin@company.com --name Admin --role owner
  Open http://<this-host>:3000

Verify:
  sha256sum -c SHA256SUMS
