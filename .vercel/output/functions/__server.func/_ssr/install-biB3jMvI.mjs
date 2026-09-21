import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { t as Button } from "./button-GlTFQgya.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/install-biB3jMvI.js
var import_jsx_runtime = require_jsx_runtime();
function InstallPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-3xl space-y-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-2xl font-semibold tracking-tight",
				children: "Install on Linux"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1 text-sm text-muted",
				children: [
					"Pulsewatch ships as a systemd service for Ubuntu and Rocky Linux. The dashboard stays behind login; users are created in this UI or with ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
						className: "font-mono",
						children: "pulsectl"
					}),
					"."
				]
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-sm font-medium",
						children: "Direct install"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-sm text-muted",
						children: [
							"Copy the packaging files onto the host and run the installer as root. It installs Node.js 22, PostgreSQL, a ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
								className: "font-mono",
								children: "pulsewatch"
							}),
							" system user, and enables the unit."
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
						className: "mt-4 overflow-x-auto rounded-lg bg-bg p-4 font-mono text-xs text-fg",
						children: `sudo bash packaging/install.sh
sudo systemctl enable --now pulsewatch
sudo pulsectl user add admin@company.com --name Admin --role admin`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 flex flex-wrap gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								asChild: true,
								variant: "secondary",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									href: "/packaging/install.sh",
									download: true,
									children: "Download install.sh"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								asChild: true,
								variant: "secondary",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									href: "/packaging/pulsewatch.service",
									download: true,
									children: "Download unit file"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								asChild: true,
								variant: "secondary",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									href: "/packaging/pulsectl",
									download: true,
									children: "Download pulsectl"
								})
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-sm font-medium",
						children: "User management from the terminal"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
						className: "mt-4 overflow-x-auto rounded-lg bg-bg p-4 font-mono text-xs leading-6 text-fg",
						children: `pulsectl user add jane@ops.example --name Jane --password '********' --role editor
pulsectl user list
pulsectl user role jane@ops.example viewer
pulsectl user passwd jane@ops.example
pulsectl user delete jane@ops.example
pulsectl backup /var/backups/pulsewatch.json
pulsectl restore /var/backups/pulsewatch.json`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-3 text-sm text-muted",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
								className: "font-mono",
								children: "pulsectl"
							}),
							" reads ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
								className: "font-mono",
								children: "/etc/pulsewatch/pulsewatch.env"
							}),
							" ",
							"and writes the same tables the web UI uses. No public sign-up. Admins can also download and restore this JSON from Settings."
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-sm font-medium",
						children: "systemd"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-sm text-muted",
						children: ["The service binds the app, starts the heartbeat engine inside the Node process, and restarts on failure. Logs: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
							className: "font-mono",
							children: "journalctl -u pulsewatch -f"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
						className: "mt-4 overflow-x-auto rounded-lg bg-bg p-4 font-mono text-xs leading-6 text-fg",
						children: `[Unit]
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
WantedBy=multi-user.target`
					})
				]
			})
		]
	});
}
//#endregion
export { InstallPage as component };
