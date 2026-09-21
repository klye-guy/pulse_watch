import { t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as cn } from "./utils-DcJqOWe7.mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/badge-Dat446PW.js
var import_jsx_runtime = require_jsx_runtime();
function HeartbeatBar({ beats, className }) {
	const slots = 36;
	const padded = [...beats];
	while (padded.length < slots) padded.unshift(null);
	const shown = padded.slice(-36);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("flex h-8 items-end gap-px", className),
		"aria-hidden": "true",
		children: shown.map((beat, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("min-w-0 flex-1 rounded-sm", beat?.status === "up" && "h-full bg-up", beat?.status === "down" && "h-full bg-down", beat?.status === "pending" && "h-3/4 bg-pending", !beat && "h-1/2 bg-elevated") }, i))
	});
}
function StatusDot({ status, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("inline-block size-2.5 shrink-0 rounded-full", status === "up" && "bg-up", status === "down" && "bg-down shadow-[0_0_10px_color-mix(in_oklab,var(--color-down)_50%,transparent)]", status === "pending" && "bg-pending", status === "paused" && "bg-paused", className) });
}
function statusLabel(status, extra) {
	if (status === "up") return "Up";
	if (status === "down") return "Down";
	if (status === "paused") return "Paused";
	if (extra?.failStreak && extra.maxRetries) return `Retry ${extra.failStreak}/${extra.maxRetries}`;
	return "Pending";
}
var badgeVariants = cva("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium tabular-nums", {
	variants: { tone: {
		up: "bg-up/15 text-up",
		down: "bg-down/15 text-down",
		pending: "bg-pending/15 text-pending",
		paused: "bg-paused/15 text-paused",
		muted: "bg-elevated text-muted"
	} },
	defaultVariants: { tone: "muted" }
});
function Badge({ className, tone, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn(badgeVariants({
			tone,
			className
		})),
		...props
	});
}
//#endregion
export { statusLabel as i, HeartbeatBar as n, StatusDot as r, Badge as t };
