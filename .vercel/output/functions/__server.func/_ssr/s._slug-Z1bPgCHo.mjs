import { r as formatPct } from "./utils-DcJqOWe7.mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { u as getPublicStatusFn } from "./fns-BD1qJbCk.mjs";
import { g as Activity } from "../_libs/lucide-react.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { i as statusLabel, n as HeartbeatBar, r as StatusDot, t as Badge } from "./badge-Dat446PW.mjs";
import { r as Route$3 } from "./router-Bh34F-X0.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/s._slug-Z1bPgCHo.js
var import_jsx_runtime = require_jsx_runtime();
function PublicStatus() {
	const { slug } = Route$3.useParams();
	const q = useQuery({
		queryKey: ["status", slug],
		queryFn: () => getPublicStatusFn({ data: slug }),
		refetchInterval: 15e3
	});
	if (q.isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "grid min-h-screen place-items-center bg-bg",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-40 w-80 animate-pulse rounded-xl bg-surface" })
	});
	if (!q.data) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "grid min-h-screen place-items-center bg-bg px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-muted",
			children: "This status page is not published."
		})
	});
	const down = q.data.monitors.filter((m) => m.lastStatus === "down").length;
	const headline = down > 0 ? `${down} service${down === 1 ? "" : "s"} disrupted` : "All systems operational";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "min-h-screen bg-bg px-4 py-12",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-2xl",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-8 flex items-center gap-2 text-accent",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Activity, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xs font-medium tracking-[0.2em] uppercase",
						children: "Pulsewatch"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-3xl font-semibold tracking-tight",
					children: q.data.title
				}),
				q.data.description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-muted",
					children: q.data.description
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: `mt-4 text-sm ${down ? "text-down" : "text-up"}`,
					children: headline
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-8 space-y-2",
					children: q.data.monitors.map((m) => {
						const tone = m.lastStatus === "up" ? "up" : m.lastStatus === "down" ? "down" : m.lastStatus === "paused" ? "paused" : "pending";
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "rounded-xl bg-surface px-4 py-3 shadow-[var(--shadow-border)]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusDot, { status: m.lastStatus }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-medium",
											children: m.name
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											tone,
											children: statusLabel(m.lastStatus)
										})
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-mono text-sm tabular-nums text-muted",
									children: formatPct(m.uptime24h)
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeartbeatBar, {
								beats: m.beats,
								className: "mt-3 h-6"
							})]
						}, m.id);
					})
				})
			]
		})
	});
}
//#endregion
export { PublicStatus as component };
