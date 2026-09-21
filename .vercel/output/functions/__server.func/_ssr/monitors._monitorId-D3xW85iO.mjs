import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { i as formatRelative, n as formatDuration, o as targetOf, r as formatPct } from "./utils-DcJqOWe7.mjs";
import { b as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { E as setMonitorChannelsFn, T as setMonitorActiveFn, c as getMonitorChannelsFn, i as deleteMonitorFn, l as getMonitorFn, p as listChannelsFn, x as saveMonitorFn } from "./fns-BD1qJbCk.mjs";
import { t as Button } from "./button-GlTFQgya.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { i as statusLabel, n as HeartbeatBar, r as StatusDot, t as Badge } from "./badge-Dat446PW.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { n as Route$2 } from "./router-Bh34F-X0.mjs";
import { t as MonitorForm } from "./monitor-form-B8Mv-TTG.mjs";
import { a as ResponsiveContainer, i as Area, n as YAxis, o as Tooltip, r as XAxis, t as AreaChart } from "../_libs/recharts+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/monitors._monitorId-D3xW85iO.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function MonitorDetail() {
	const { monitorId } = Route$2.useParams();
	const navigate = useNavigate();
	const qc = useQueryClient();
	const [editing, setEditing] = (0, import_react.useState)(false);
	const monitor = useQuery({
		queryKey: ["monitor", monitorId],
		queryFn: () => getMonitorFn({ data: monitorId }),
		refetchInterval: 8e3
	});
	const channels = useQuery({
		queryKey: ["channels"],
		queryFn: () => listChannelsFn()
	});
	const linked = useQuery({
		queryKey: ["monitor-channels", monitorId],
		queryFn: () => getMonitorChannelsFn({ data: monitorId })
	});
	const save = useMutation({
		mutationFn: saveMonitorFn,
		onSuccess: () => {
			toast.success("Saved");
			setEditing(false);
			qc.invalidateQueries({ queryKey: ["monitor", monitorId] });
			qc.invalidateQueries({ queryKey: ["monitors"] });
		}
	});
	const pause = useMutation({
		mutationFn: setMonitorActiveFn,
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["monitor", monitorId] });
			qc.invalidateQueries({ queryKey: ["monitors"] });
		}
	});
	const remove = useMutation({
		mutationFn: () => deleteMonitorFn({ data: monitorId }),
		onSuccess: () => {
			toast.success("Deleted");
			navigate({ to: "/" });
		}
	});
	const link = useMutation({
		mutationFn: (channelIds) => setMonitorChannelsFn({ data: {
			monitorId,
			channelIds
		} }),
		onSuccess: () => {
			toast.success("Notifications updated");
			qc.invalidateQueries({ queryKey: ["monitor-channels", monitorId] });
		}
	});
	const m = monitor.data;
	const chart = (0, import_react.useMemo)(() => (m?.beats ?? []).filter((b) => b.ping != null).map((b) => ({
		t: new Date(b.checkedAt).toLocaleTimeString([], {
			hour: "2-digit",
			minute: "2-digit"
		}),
		ping: b.ping
	})), [m]);
	if (monitor.isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mx-auto h-64 max-w-5xl animate-pulse rounded-xl bg-surface" });
	if (!m) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-muted",
		children: "Monitor not found."
	});
	const tone = m.lastStatus === "up" ? "up" : m.lastStatus === "down" ? "down" : m.lastStatus === "paused" ? "paused" : "pending";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-5xl space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-start justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusDot, { status: m.lastStatus }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "text-2xl font-semibold tracking-tight",
								children: m.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone,
								children: statusLabel(m.lastStatus, {
									failStreak: m.failStreak,
									maxRetries: m.maxRetries
								})
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 font-mono text-sm text-muted",
						children: targetOf(m)
					}),
					m.lastMsg && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-subtle",
						children: m.lastMsg
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							onClick: () => setEditing((v) => !v),
							children: editing ? "Close editor" : "Edit"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							onClick: () => pause.mutate({ data: {
								id: m.id,
								active: !m.active
							} }),
							children: m.active ? "Pause" : "Resume"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "danger",
							onClick: () => {
								if (window.confirm("Delete this monitor and its heartbeats?")) remove.mutate();
							},
							children: "Delete"
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 sm:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
						label: "24h uptime",
						value: formatPct(m.uptime24h)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
						label: "30d uptime",
						value: formatPct(m.uptime30d)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
						label: "Last ping",
						value: formatDuration(m.lastPing)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
						label: "Last check",
						value: formatRelative(m.lastCheckedAt)
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mb-3 text-sm font-medium",
					children: "Heartbeat"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeartbeatBar, {
					beats: m.beats,
					className: "h-10"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mb-3 text-sm font-medium",
					children: "Response time"
				}), chart.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "py-10 text-center text-sm text-muted",
					children: "Waiting for the first successful checks."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-56 overflow-hidden",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
						width: "100%",
						height: "100%",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AreaChart, {
							data: chart,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
									dataKey: "t",
									tick: {
										fill: "var(--color-muted)",
										fontSize: 11
									},
									axisLine: false,
									tickLine: false
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
									tick: {
										fill: "var(--color-muted)",
										fontSize: 11
									},
									axisLine: false,
									tickLine: false,
									width: 40
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, { contentStyle: {
									background: "var(--color-elevated)",
									border: "1px solid var(--color-border)",
									borderRadius: 8,
									color: "var(--color-fg)"
								} }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Area, {
									type: "monotone",
									dataKey: "ping",
									stroke: "var(--color-accent)",
									fill: "var(--color-accent)",
									fillOpacity: .15
								})
							]
						})
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mb-3 text-sm font-medium",
						children: "Notify on status change"
					}),
					channels.data && channels.data.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: "No channels yet. Add one under Notifications."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex flex-col gap-2",
						children: (channels.data ?? []).map((ch) => {
							const checked = linked.data?.includes(ch.id) ?? false;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "flex h-10 items-center gap-2 text-sm",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "checkbox",
										className: "size-4 accent-accent",
										checked,
										onChange: () => {
											const next = new Set(linked.data ?? []);
											if (checked) next.delete(ch.id);
											else next.add(ch.id);
											link.mutate([...next]);
										}
									}),
									ch.name,
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-xs uppercase text-subtle",
										children: ch.type
									})
								]
							}, ch.id);
						})
					})
				]
			}),
			editing && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mb-4 text-sm font-medium",
					children: "Edit monitor"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MonitorForm, {
					initial: {
						id: m.id,
						name: m.name,
						type: m.type,
						url: m.url ?? "",
						hostname: m.hostname ?? "",
						port: m.port ?? void 0,
						method: m.method,
						keyword: m.keyword ?? "",
						keywordInvert: m.keywordInvert,
						dnsRecordType: m.dnsRecordType,
						intervalSec: m.intervalSec,
						timeoutSec: m.timeoutSec,
						acceptedStatus: m.acceptedStatus,
						tags: m.tags,
						active: m.active,
						maxRetries: m.maxRetries,
						retryIntervalSec: m.retryIntervalSec,
						resendIntervalSec: m.resendIntervalSec
					},
					submitting: save.isPending,
					onSubmit: (input) => save.mutate({ data: input })
				})]
			})
		]
	});
}
function Mini({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-xl bg-surface px-4 py-3 shadow-[var(--shadow-border)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs text-muted",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 font-mono text-lg tabular-nums",
			children: value
		})]
	});
}
//#endregion
export { MonitorDetail as component };
