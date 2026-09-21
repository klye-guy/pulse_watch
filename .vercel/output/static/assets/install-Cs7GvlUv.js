import{t as e}from"./jsx-runtime-0vZSBttN.js";import{t}from"./button-DzKe1Wja.js";var n=e();function r(){return(0,n.jsxs)(`div`,{className:`mx-auto max-w-3xl space-y-8`,children:[(0,n.jsxs)(`div`,{children:[(0,n.jsx)(`h1`,{className:`text-2xl font-semibold tracking-tight`,children:`Install on Linux`}),(0,n.jsxs)(`p`,{className:`mt-1 text-sm text-muted`,children:[`Pulsewatch ships as a systemd service for Ubuntu and Rocky Linux. The dashboard stays behind login; users are created in this UI or with `,(0,n.jsx)(`code`,{className:`font-mono`,children:`pulsectl`}),`.`]})]}),(0,n.jsxs)(`section`,{className:`rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]`,children:[(0,n.jsx)(`h2`,{className:`text-sm font-medium`,children:`Direct install`}),(0,n.jsxs)(`p`,{className:`mt-2 text-sm text-muted`,children:[`Copy the packaging files onto the host and run the installer as root. It installs Node.js 22, PostgreSQL, a `,(0,n.jsx)(`code`,{className:`font-mono`,children:`pulsewatch`}),` system user, and enables the unit.`]}),(0,n.jsx)(`pre`,{className:`mt-4 overflow-x-auto rounded-lg bg-bg p-4 font-mono text-xs text-fg`,children:`sudo bash packaging/install.sh
sudo systemctl enable --now pulsewatch
sudo pulsectl user add admin@company.com --name Admin --role admin`}),(0,n.jsxs)(`div`,{className:`mt-4 flex flex-wrap gap-2`,children:[(0,n.jsx)(t,{asChild:!0,variant:`secondary`,children:(0,n.jsx)(`a`,{href:`/packaging/install.sh`,download:!0,children:`Download install.sh`})}),(0,n.jsx)(t,{asChild:!0,variant:`secondary`,children:(0,n.jsx)(`a`,{href:`/packaging/pulsewatch.service`,download:!0,children:`Download unit file`})}),(0,n.jsx)(t,{asChild:!0,variant:`secondary`,children:(0,n.jsx)(`a`,{href:`/packaging/pulsectl`,download:!0,children:`Download pulsectl`})})]})]}),(0,n.jsxs)(`section`,{className:`rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]`,children:[(0,n.jsx)(`h2`,{className:`text-sm font-medium`,children:`User management from the terminal`}),(0,n.jsx)(`pre`,{className:`mt-4 overflow-x-auto rounded-lg bg-bg p-4 font-mono text-xs leading-6 text-fg`,children:`pulsectl user add jane@ops.example --name Jane --password '********' --role editor
pulsectl user list
pulsectl user role jane@ops.example viewer
pulsectl user passwd jane@ops.example
pulsectl user delete jane@ops.example
pulsectl backup /var/backups/pulsewatch.json
pulsectl restore /var/backups/pulsewatch.json`}),(0,n.jsxs)(`p`,{className:`mt-3 text-sm text-muted`,children:[(0,n.jsx)(`code`,{className:`font-mono`,children:`pulsectl`}),` reads `,(0,n.jsx)(`code`,{className:`font-mono`,children:`/etc/pulsewatch/pulsewatch.env`}),` `,`and writes the same tables the web UI uses. No public sign-up. Admins can also download and restore this JSON from Settings.`]})]}),(0,n.jsxs)(`section`,{className:`rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]`,children:[(0,n.jsx)(`h2`,{className:`text-sm font-medium`,children:`systemd`}),(0,n.jsxs)(`p`,{className:`mt-2 text-sm text-muted`,children:[`The service binds the app, starts the heartbeat engine inside the Node process, and restarts on failure. Logs: `,(0,n.jsx)(`code`,{className:`font-mono`,children:`journalctl -u pulsewatch -f`})]}),(0,n.jsx)(`pre`,{className:`mt-4 overflow-x-auto rounded-lg bg-bg p-4 font-mono text-xs leading-6 text-fg`,children:`[Unit]
Description=Pulsewatch uptime monitor
After=network.target postgresql.service

[Service]
Type=simple
User=pulsewatch
EnvironmentFile=/etc/pulsewatch/pulsewatch.env
WorkingDirectory=/opt/pulsewatch
ExecStart=/usr/bin/node /opt/pulsewatch/.output/server/index.mjs
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target`})]})]})}export{r as component};