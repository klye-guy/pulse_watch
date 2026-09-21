import { o as __toESM } from "./_runtime.mjs";
import { n as require_react } from "./_libs/@radix-ui/react-compose-refs+[...].mjs";
import { i as formatRelative, n as formatDuration, o as targetOf, r as formatPct } from "./_ssr/utils-DcJqOWe7.mjs";
import { v as Link } from "./_libs/@tanstack/react-router+[...].mjs";
import { n as require_jsx_runtime } from "./_libs/radix-ui__react-context+react.mjs";
import { T as setMonitorActiveFn, h as listMonitorsFn, i as deleteMonitorFn } from "./_ssr/fns-BD1qJbCk.mjs";
import { t as Button } from "./_ssr/button-GlTFQgya.mjs";
import { d as Pause, i as Trash2, l as Plus, s as Search, u as Play } from "./_libs/lucide-react.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "./_libs/tanstack__react-query.mjs";
import { i as statusLabel, n as HeartbeatBar, r as StatusDot, t as Badge } from "./_ssr/badge-Dat446PW.mjs";
import { t as Input } from "./_ssr/input-D6GLTri9.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_app-CE_7nwHN.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Dashboard() {
	const qc = useQueryClient();
	const [query, setQuery] = (0, import_react.useState)("");
	const [filter, setFilter] = (0, import_react.useState)("all");
	const q = useQuery({
		queryKey: ["monitors"],
		queryFn: () => listMonitorsFn(),
		refetchInterval: 8e3
	});
	const pause = useMutation({
		mutationFn: setMonitorActiveFn,
		onSuccess: () => qc.invalidateQueries({ queryKey: ["monitors"] })
	});
	const remove = useMutation({
		mutationFn: (id) => deleteMonitorFn({ data: id }),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["monitors"] })
	});
	const monitors = q.data ?? [];
	const up = monitors.filter((m) => m.lastStatus === "up").length;
	const down = monitors.filter((m) => m.lastStatus === "down").length;
	const pending = monitors.filter((m) => m.lastStatus === "pending").length;
	const paused = monitors.filter((m) => m.lastStatus === "paused").length;
	const avgUptime = monitors.length === 0 ? null : monitors.reduce((acc, m) => acc + (m.uptime24h ?? 0), 0) / monitors.length;
	const visible = (0, import_react.useMemo)(() => {
		const needle = query.trim().toLowerCase();
		const rank = (s) => s === "down" ? 0 : s === "pending" ? 1 : s === "paused" ? 2 : 3;
		return monitors.filter((m) => filter === "all" ? true : m.lastStatus === filter).filter((m) => {
			if (!needle) return true;
			return m.name.toLowerCase().includes(needle) || targetOf(m).toLowerCase().includes(needle) || m.tags.toLowerCase().includes(needle) || m.type.toLowerCase().includes(needle);
		}).sort((a, b) => rank(a.lastStatus) - rank(b.lastStatus) || a.name.localeCompare(b.name));
	}, [
		monitors,
		query,
		filter
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-6xl space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-end justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-2xl font-semibold tracking-tight",
					children: "Dashboard"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 text-sm text-muted",
					children: [
						monitors.length,
						" monitor",
						monitors.length === 1 ? "" : "s",
						". Down and retrying stay at the top."
					]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					asChild: true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/monitors/new",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), "New monitor"]
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-3 md:grid-cols-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Up",
						value: String(up),
						tone: "up"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Down",
						value: String(down),
						tone: "down"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Retrying",
						value: String(pending),
						tone: "pending"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Paused",
						value: String(paused),
						tone: "paused"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "24h uptime",
						value: formatPct(avgUptime)
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-3 sm:flex-row sm:items-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "relative min-w-0 flex-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: query,
						onChange: (e) => setQuery(e.target.value),
						placeholder: "Filter by name, URL, or tag",
						className: "pl-9"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex flex-wrap gap-1.5",
					children: [
						["all", "All"],
						["down", "Down"],
						["pending", "Retrying"],
						["up", "Up"],
						["paused", "Paused"]
					].map(([value, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setFilter(value),
						className: filter === value ? "h-10 rounded-md bg-elevated px-3 text-sm shadow-[var(--shadow-border-hover)]" : "h-10 rounded-md px-3 text-sm text-muted hover:bg-elevated hover:text-fg",
						children: label
					}, value))
				})]
			}),
			q.isPending && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-2",
				children: Array.from({ length: 4 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-20 animate-pulse rounded-xl bg-surface" }, i))
			}),
			!q.isPending && monitors.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-xl bg-surface px-6 py-16 text-center shadow-[var(--shadow-border)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "No monitors yet. Add an HTTP, TCP, ping, or DNS check."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					asChild: true,
					className: "mt-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/monitors/new",
						children: "Create the first monitor"
					})
				})]
			}),
			!q.isPending && monitors.length > 0 && visible.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "No monitors match that filter."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "space-y-2",
				children: visible.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MonitorRow, {
					monitor: m,
					onPause: () => pause.mutate({ data: {
						id: m.id,
						active: !m.active
					} }),
					onDelete: () => {
						if (window.confirm(`Delete ${m.name}?`)) remove.mutate(m.id);
					}
				}, m.id))
			})
		]
	});
}
function Stat({ label, value, tone }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-xl bg-surface px-4 py-3 shadow-[var(--shadow-border)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs text-muted",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: tone === "up" ? "mt-1 font-mono text-2xl tabular-nums text-up" : tone === "down" ? "mt-1 font-mono text-2xl tabular-nums text-down" : tone === "paused" ? "mt-1 font-mono text-2xl tabular-nums text-paused" : tone === "pending" ? "mt-1 font-mono text-2xl tabular-nums text-pending" : "mt-1 font-mono text-2xl tabular-nums",
			children: value
		})]
	});
}
function MonitorRow({ monitor: m, onPause, onDelete }) {
	const tone = m.lastStatus === "up" ? "up" : m.lastStatus === "down" ? "down" : m.lastStatus === "paused" ? "paused" : "pending";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
		className: "rounded-xl bg-surface px-4 py-3 shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)]",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col gap-3 lg:flex-row lg:items-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/monitors/$monitorId",
					params: { monitorId: m.id },
					className: "min-w-0 flex-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusDot, { status: m.lastStatus }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "truncate font-medium",
								children: m.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone,
								children: statusLabel(m.lastStatus, {
									failStreak: m.failStreak,
									maxRetries: m.maxRetries
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "hidden text-xs uppercase tracking-wide text-subtle sm:inline",
								children: m.type
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 truncate font-mono text-xs text-subtle",
						children: targetOf(m)
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "w-full min-w-0 lg:w-64",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeartbeatBar, { beats: m.beats })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-4 text-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-16",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-subtle",
								children: "24h"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-mono tabular-nums",
								children: formatPct(m.uptime24h)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-16",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-subtle",
								children: "Ping"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-mono tabular-nums",
								children: formatDuration(m.lastPing)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "hidden min-w-20 sm:block",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-subtle",
								children: "Checked"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-muted",
								children: formatRelative(m.lastCheckedAt)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "ml-auto flex",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								size: "icon",
								onClick: onPause,
								"aria-label": m.active ? "Pause" : "Resume",
								children: m.active ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, {})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								size: "icon",
								onClick: onDelete,
								"aria-label": "Delete",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, {})
							})]
						})
					]
				})
			]
		})
	});
}
//#endregion
export { Dashboard as component };
