import { n as clsx } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/utils-DcJqOWe7.js
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function newId() {
	return crypto.randomUUID().replaceAll("-", "");
}
function formatDuration(ms) {
	if (ms == null || Number.isNaN(ms)) return "—";
	if (ms < 1e3) return `${Math.round(ms)} ms`;
	return `${(ms / 1e3).toFixed(2)} s`;
}
function formatRelative(iso) {
	if (!iso) return "never";
	const then = new Date(iso).getTime();
	if (Number.isNaN(then)) return "never";
	const delta = Date.now() - then;
	const sec = Math.round(delta / 1e3);
	if (sec < 10) return "just now";
	if (sec < 60) return `${sec}s ago`;
	const min = Math.round(sec / 60);
	if (min < 60) return `${min}m ago`;
	const hr = Math.round(min / 60);
	if (hr < 48) return `${hr}h ago`;
	return `${Math.round(hr / 24)}d ago`;
}
function formatPct(n) {
	if (n == null || Number.isNaN(n)) return "—";
	if (n >= 99.995) return "100%";
	return `${n.toFixed(2)}%`;
}
function targetOf(m) {
	if (m.type === "tcp") return `${m.hostname ?? ""}:${m.port ?? ""}`;
	if (m.type === "ping" || m.type === "dns") return m.hostname ?? m.url ?? "";
	return m.url ?? m.hostname ?? "";
}
//#endregion
export { newId as a, formatRelative as i, formatDuration as n, targetOf as o, formatPct as r, cn as t };
