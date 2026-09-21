import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { i as formatRelative } from "./utils-DcJqOWe7.mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { O as testChannelFn, b as saveChannelFn, g as listNotifyLogFn, p as listChannelsFn, r as deleteChannelFn } from "./fns-BD1qJbCk.mjs";
import { t as Button } from "./button-GlTFQgya.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { t as Input } from "./input-D6GLTri9.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Label } from "./label-Bfr74K1a.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/notifications-BznBsf9p.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var TYPES = [
	{
		value: "email",
		label: "Email (SMTP)"
	},
	{
		value: "webhook",
		label: "Webhook"
	},
	{
		value: "discord",
		label: "Discord"
	},
	{
		value: "slack",
		label: "Slack"
	},
	{
		value: "telegram",
		label: "Telegram"
	}
];
function NotificationsPage() {
	const qc = useQueryClient();
	const channels = useQuery({
		queryKey: ["channels"],
		queryFn: () => listChannelsFn()
	});
	const log = useQuery({
		queryKey: ["notify-log"],
		queryFn: () => listNotifyLogFn(),
		refetchInterval: 15e3
	});
	const [name, setName] = (0, import_react.useState)("");
	const [type, setType] = (0, import_react.useState)("email");
	const [url, setUrl] = (0, import_react.useState)("");
	const [token, setToken] = (0, import_react.useState)("");
	const [chatId, setChatId] = (0, import_react.useState)("");
	const [host, setHost] = (0, import_react.useState)("");
	const [port, setPort] = (0, import_react.useState)("587");
	const [smtpSecure, setSmtpSecure] = (0, import_react.useState)("starttls");
	const [user, setUser] = (0, import_react.useState)("");
	const [pass, setPass] = (0, import_react.useState)("");
	const [from, setFrom] = (0, import_react.useState)("");
	const [to, setTo] = (0, import_react.useState)("");
	const [applyToAll, setApplyToAll] = (0, import_react.useState)(true);
	const save = useMutation({
		mutationFn: saveChannelFn,
		onSuccess: () => {
			toast.success("Channel saved");
			setName("");
			setUrl("");
			setToken("");
			setChatId("");
			setHost("");
			setPass("");
			setTo("");
			setUser("");
			setFrom("");
			qc.invalidateQueries({ queryKey: ["channels"] });
		},
		onError: (err) => toast.error(err instanceof Error ? err.message : "Could not save")
	});
	const remove = useMutation({
		mutationFn: (id) => deleteChannelFn({ data: id }),
		onSuccess: () => {
			toast.success("Channel removed");
			qc.invalidateQueries({ queryKey: ["channels"] });
		}
	});
	const test = useMutation({
		mutationFn: (id) => testChannelFn({ data: id }),
		onSuccess: () => {
			toast.success("Test sent");
			qc.invalidateQueries({ queryKey: ["notify-log"] });
		},
		onError: (err) => toast.error(err instanceof Error ? err.message : "Test failed")
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-4xl space-y-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-2xl font-semibold tracking-tight",
				children: "Notifications"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-muted",
				children: "Email, webhook, Discord, Slack, or Telegram. Alerts fire only after retries confirm a monitor is down, and again when it recovers. Attach a channel on the monitor page."
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mb-4 text-sm font-medium",
					children: "New channel"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "grid gap-3 sm:grid-cols-2",
					onSubmit: (e) => {
						e.preventDefault();
						save.mutate({ data: {
							name,
							type,
							config: {
								url,
								token,
								chatId,
								host,
								port,
								smtpSecure,
								user,
								pass,
								from,
								to
							},
							applyToAll
						} });
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "grid gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Name" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								required: true,
								value: name,
								onChange: (e) => setName(e.target.value),
								placeholder: "Ops alerts"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "grid gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Type" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
								className: "h-10 rounded-md border border-border bg-bg px-3 text-sm",
								value: type,
								onChange: (e) => setType(e.target.value),
								children: TYPES.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: t.value,
									children: t.label
								}, t.value))
							})]
						}),
						type === "email" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "grid gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "SMTP host" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									required: true,
									value: host,
									onChange: (e) => setHost(e.target.value),
									placeholder: "smtp.office365.com"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-2 gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "grid gap-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Port" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: port,
										onChange: (e) => setPort(e.target.value),
										inputMode: "numeric"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "grid gap-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Security" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										className: "h-10 rounded-md border border-border bg-bg px-3 text-sm",
										value: smtpSecure,
										onChange: (e) => setSmtpSecure(e.target.value),
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "starttls",
												children: "STARTTLS"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "tls",
												children: "TLS"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "none",
												children: "None"
											})
										]
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "grid gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Username" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: user,
									onChange: (e) => setUser(e.target.value),
									autoComplete: "off"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "grid gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Password" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "password",
									value: pass,
									onChange: (e) => setPass(e.target.value),
									autoComplete: "new-password"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "grid gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "From" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: from,
									onChange: (e) => setFrom(e.target.value),
									placeholder: "alerts@company.com"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "grid gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "To" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									required: true,
									value: to,
									onChange: (e) => setTo(e.target.value),
									placeholder: "ops@company.com, oncall@company.com"
								})]
							})
						] }),
						type !== "telegram" && type !== "email" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "grid gap-1.5 sm:col-span-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: type === "webhook" ? "Webhook URL" : "Incoming webhook URL" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								required: true,
								value: url,
								onChange: (e) => setUrl(e.target.value),
								placeholder: "https://"
							})]
						}),
						type === "telegram" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "grid gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Bot token" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								required: true,
								value: token,
								onChange: (e) => setToken(e.target.value)
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "grid gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Chat ID" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								required: true,
								value: chatId,
								onChange: (e) => setChatId(e.target.value)
							})]
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "flex items-center gap-2 text-sm text-muted sm:col-span-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "checkbox",
								className: "size-4 accent-accent",
								checked: applyToAll,
								onChange: (e) => setApplyToAll(e.target.checked)
							}), "Attach to every existing monitor"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "sm:col-span-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "submit",
								disabled: save.isPending,
								children: "Save channel"
							})
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "space-y-2",
				children: (channels.data ?? []).map((ch) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-3 rounded-xl bg-surface px-4 py-3 shadow-[var(--shadow-border)] sm:flex-row sm:items-center sm:justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-medium",
							children: ch.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "truncate text-xs uppercase tracking-wide text-subtle",
							children: [ch.type, ch.type === "email" && ch.config.to ? ` · ${ch.config.to}` : ""]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex shrink-0 gap-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: "secondary",
							disabled: test.isPending,
							onClick: () => test.mutate(ch.id),
							children: "Send test"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: "ghost",
							onClick: () => remove.mutate(ch.id),
							children: "Remove"
						})]
					})]
				}, ch.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mb-3 text-sm font-medium",
				children: "Recent events"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
				className: "space-y-2",
				children: [(log.data ?? []).map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "rounded-xl bg-surface px-4 py-3 text-sm shadow-[var(--shadow-border)]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: row.event === "down" ? "text-down" : row.event === "test" ? "text-muted" : "text-up",
								children: row.event
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-subtle",
								children: formatRelative(row.createdAt)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-muted",
							children: [row.event === "test" ? "Test" : row.monitorName ?? "monitor", row.channelName ? ` → ${row.channelName}` : ""]
						}),
						row.detail && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-xs text-subtle",
							children: row.detail
						})
					]
				}, row.id)), (log.data ?? []).length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "No events yet."
				})]
			})] })
		]
	});
}
//#endregion
export { NotificationsPage as component };
