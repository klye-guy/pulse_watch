import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { D as setSiteNameFn, f as getSiteNameFn, o as exportBackupFn, s as getAccessState, y as restoreBackupFn } from "./fns-BD1qJbCk.mjs";
import { t as Button } from "./button-GlTFQgya.mjs";
import { m as Download, n as Upload } from "../_libs/lucide-react.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { t as Input } from "./input-D6GLTri9.mjs";
import { n as backupFilename, r as parseBackup } from "./backup-format-BiFNZH6i.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Label } from "./label-Bfr74K1a.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/settings-jFCeAgqA.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function SettingsPage() {
	const qc = useQueryClient();
	const site = useQuery({
		queryKey: ["site-name"],
		queryFn: () => getSiteNameFn()
	});
	const access = useQuery({
		queryKey: ["access"],
		queryFn: () => getAccessState()
	});
	const [name, setName] = (0, import_react.useState)("");
	const [replace, setReplace] = (0, import_react.useState)(false);
	const [pendingFile, setPendingFile] = (0, import_react.useState)(null);
	const fileRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (site.data) setName(site.data.siteName);
	}, [site.data]);
	const save = useMutation({
		mutationFn: (value) => setSiteNameFn({ data: value }),
		onSuccess: () => {
			toast.success("Saved");
			qc.invalidateQueries({ queryKey: ["site-name"] });
		}
	});
	const download = useMutation({
		mutationFn: () => exportBackupFn(),
		onSuccess: (backup) => {
			const blob = new Blob([`${JSON.stringify(backup, null, 2)}\n`], { type: "application/json" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = backupFilename(backup.exportedAt);
			document.body.appendChild(a);
			a.click();
			a.remove();
			URL.revokeObjectURL(url);
			toast.success("Backup downloaded");
		},
		onError: (err) => toast.error(err instanceof Error ? err.message : "Could not export")
	});
	const restore = useMutation({
		mutationFn: restoreBackupFn,
		onSuccess: (result) => {
			setPendingFile(null);
			setReplace(false);
			toast.success(`Restored ${result.monitors} monitors, ${result.users} users, ${result.channels} channels`);
			qc.invalidateQueries();
		},
		onError: (err) => toast.error(err instanceof Error ? err.message : "Could not restore")
	});
	const role = access.data?.status === "ok" ? access.data.role : "viewer";
	const canBackup = role === "admin" || role === "owner";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-2xl space-y-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-2xl font-semibold tracking-tight",
				children: "Settings"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-muted",
				children: "Instance identity, membership, and configuration backups."
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mb-4 text-sm font-medium",
					children: "This instance"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "grid gap-3",
					onSubmit: (e) => {
						e.preventDefault();
						save.mutate(name);
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "grid gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Display name" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: name,
							onChange: (e) => setName(e.target.value)
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						disabled: save.isPending || role === "viewer" || role === "editor",
						children: "Save"
					}) })]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mb-2 text-sm font-medium",
					children: "Your access"
				}), access.data?.status === "ok" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
					className: "grid gap-2 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-between gap-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
							className: "text-muted",
							children: "Role"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
							className: "font-mono capitalize",
							children: access.data.role
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-between gap-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
							className: "text-muted",
							children: "Email"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
							className: "font-mono",
							children: access.data.email ?? "—"
						})]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mb-2 text-sm font-medium",
						children: "Backup & restore"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: "One JSON file covers users (including password hashes), monitors, notification channels, status pages, and the instance name. Heartbeat history is not included. Treat the file as a secret — it contains webhook tokens and hashes."
					}),
					canBackup ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-5 space-y-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									type: "button",
									variant: "secondary",
									disabled: download.isPending,
									onClick: () => download.mutate(),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {}), download.isPending ? "Preparing…" : "Download backup"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									type: "button",
									onClick: () => fileRef.current?.click(),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, {}), "Choose backup file"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									ref: fileRef,
									type: "file",
									accept: "application/json,.json",
									className: "hidden",
									onChange: (e) => {
										const file = e.target.files?.[0];
										e.target.value = "";
										if (!file) return;
										const reader = new FileReader();
										reader.onload = () => {
											try {
												const parsed = parseBackup(JSON.parse(String(reader.result ?? "")));
												setPendingFile({
													name: file.name,
													backup: parsed
												});
											} catch (err) {
												toast.error(err instanceof Error ? err.message : "Could not read that JSON file");
											}
										};
										reader.readAsText(file);
									}
								})
							]
						}), pendingFile && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-lg bg-elevated p-4 shadow-[var(--shadow-border)]",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm font-medium",
									children: pendingFile.name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-xs text-muted",
									children: "Merge updates matching users (by email) and monitors (by id) without deleting anything. Replace wipes monitors, channels, and status pages first, then imports. Users are always merged so you cannot lock yourself out."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "mt-3 flex items-start gap-2 text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "checkbox",
										className: "mt-1 size-4 accent-accent",
										checked: replace,
										onChange: (e) => setReplace(e.target.checked)
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Replace existing monitors, channels, and status pages" })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-4 flex flex-wrap gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										type: "button",
										disabled: restore.isPending,
										onClick: () => {
											const mode = replace ? "replace" : "merge";
											if (mode === "replace") {
												if (!window.confirm("Replace will delete current monitors, channels, and status pages, then import this file. Continue?")) return;
											}
											restore.mutate({ data: {
												backup: pendingFile.backup,
												mode
											} });
										},
										children: restore.isPending ? "Restoring…" : replace ? "Replace from backup" : "Merge from backup"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										type: "button",
										variant: "ghost",
										onClick: () => setPendingFile(null),
										children: "Cancel"
									})]
								})
							]
						})]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-sm text-subtle",
						children: "Only admins can export or restore configuration."
					})
				]
			})
		]
	});
}
//#endregion
export { SettingsPage as component };
