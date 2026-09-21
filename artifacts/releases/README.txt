Pulsewatch 1.0.0 Linux packages

  pulsewatch_1.0.0-1_all.deb
      sudo apt-get update
      sudo apt install ./pulsewatch_1.0.0-1_all.deb

  pulsewatch-1.0.0-1.noarch.rpm
      sudo dnf install ./pulsewatch-1.0.0-1.noarch.rpm

  pulsewatch-1.0.0.tar.gz
      tar -xzf pulsewatch-1.0.0.tar.gz
      cd pulsewatch-1.0.0
      sudo bash packaging/install.sh

Then:
  sudo pulsectl user add admin@company.com --name Admin --role owner
  Open http://<this-host>:3000

Verify:
  sha256sum -c SHA256SUMS
