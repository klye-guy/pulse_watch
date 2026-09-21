import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { t as Button } from "./button-GlTFQgya.mjs";
import { t as Input } from "./input-D6GLTri9.mjs";
import { i as RETRY_INTERVAL_OPTIONS, n as RESEND_INTERVAL_OPTIONS, r as RETRY_COUNT_OPTIONS, t as INTERVAL_OPTIONS } from "./types-DYYyg_em.mjs";
import { t as Label } from "./label-Bfr74K1a.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/monitor-form-B8Mv-TTG.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var TYPES = [
	{
		value: "http",
		label: "HTTP(s)",
		hint: "Status code of a URL"
	},
	{
		value: "keyword",
		label: "Keyword",
		hint: "HTTP body contains a string"
	},
	{
		value: "tcp",
		label: "TCP",
		hint: "Port is accepting connections"
	},
	{
		value: "ping",
		label: "Ping",
		hint: "ICMP, falling back to TCP"
	},
	{
		value: "dns",
		label: "DNS",
		hint: "Hostname resolves"
	}
];
function MonitorForm({ initial, submitting, onSubmit }) {
	const [type, setType] = (0, import_react.useState)(initial?.type ?? "http");
	const [name, setName] = (0, import_react.useState)(initial?.name ?? "");
	const [url, setUrl] = (0, import_react.useState)(initial?.url ?? "");
	const [method, setMethod] = (0, import_react.useState)(initial?.method ?? "GET");
	const [keyword, setKeyword] = (0, import_react.useState)(initial?.keyword ?? "");
	const [keywordInvert, setKeywordInvert] = (0, import_react.useState)(initial?.keywordInvert ?? false);
	const [hostname, setHostname] = (0, import_react.useState)(initial?.hostname ?? "");
	const [port, setPort] = (0, import_react.useState)(String(initial?.port ?? 443));
	const [dnsRecordType, setDnsRecordType] = (0, import_react.useState)(initial?.dnsRecordType ?? "A");
	const [intervalSec, setIntervalSec] = (0, import_react.useState)(initial?.intervalSec ?? 60);
	const [timeoutSec, setTimeoutSec] = (0, import_react.useState)(initial?.timeoutSec ?? 10);
	const [acceptedStatus, setAcceptedStatus] = (0, import_react.useState)(initial?.acceptedStatus ?? "200-299");
	const [tags, setTags] = (0, import_react.useState)(initial?.tags ?? "");
	const [maxRetries, setMaxRetries] = (0, import_react.useState)(initial?.maxRetries ?? 2);
	const [retryIntervalSec, setRetryIntervalSec] = (0, import_react.useState)(initial?.retryIntervalSec ?? 20);
	const [resendIntervalSec, setResendIntervalSec] = (0, import_react.useState)(initial?.resendIntervalSec ?? 0);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		className: "space-y-5",
		onSubmit: (e) => {
			e.preventDefault();
			onSubmit({
				id: initial?.id,
				name,
				type,
				url,
				method,
				keyword,
				keywordInvert,
				hostname,
				port: Number(port) || void 0,
				dnsRecordType,
				intervalSec,
				timeoutSec,
				acceptedStatus,
				tags,
				active: initial?.active ?? true,
				maxRetries,
				retryIntervalSec,
				resendIntervalSec
			});
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Name",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					required: true,
					value: name,
					onChange: (e) => setName(e.target.value),
					placeholder: "Production API"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Type" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-2 gap-2 sm:grid-cols-5",
					children: TYPES.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => setType(t.value),
						className: type === t.value ? "rounded-md bg-elevated px-3 py-2 text-left shadow-[var(--shadow-border-hover)]" : "rounded-md border border-border px-3 py-2 text-left text-muted hover:text-fg",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block text-sm font-medium text-fg",
							children: t.label
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mt-0.5 block text-xs text-subtle",
							children: t.hint
						})]
					}, t.value))
				})]
			}),
			(type === "http" || type === "keyword") && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "URL",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					required: true,
					value: url,
					onChange: (e) => setUrl(e.target.value),
					placeholder: "https://status.example.com/health"
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 sm:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Method",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
						className: "h-10 w-full rounded-md border border-border bg-bg px-3 text-sm",
						value: method,
						onChange: (e) => setMethod(e.target.value),
						children: [
							"GET",
							"HEAD",
							"POST",
							"PUT"
						].map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: m }, m))
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Accepted status",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: acceptedStatus,
						onChange: (e) => setAcceptedStatus(e.target.value),
						placeholder: "200-299"
					})
				})]
			})] }),
			type === "keyword" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 sm:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Keyword",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						required: true,
						value: keyword,
						onChange: (e) => setKeyword(e.target.value),
						placeholder: "\"ok\":true"
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "flex items-end gap-2 pb-2 text-sm text-muted",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "checkbox",
						checked: keywordInvert,
						onChange: (e) => setKeywordInvert(e.target.checked),
						className: "size-4 accent-accent"
					}), "Invert (fail if present)"]
				})]
			}),
			(type === "tcp" || type === "ping" || type === "dns") && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 sm:grid-cols-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Hostname",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							required: true,
							value: hostname,
							onChange: (e) => setHostname(e.target.value),
							placeholder: "db.internal"
						})
					}),
					type === "tcp" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Port",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: port,
							onChange: (e) => setPort(e.target.value),
							inputMode: "numeric"
						})
					}),
					type === "dns" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Record type",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
							className: "h-10 w-full rounded-md border border-border bg-bg px-3 text-sm",
							value: dnsRecordType,
							onChange: (e) => setDnsRecordType(e.target.value),
							children: [
								"A",
								"AAAA",
								"CNAME",
								"MX",
								"TXT",
								"NS"
							].map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: m }, m))
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 sm:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Heartbeat",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
							className: "h-10 w-full rounded-md border border-border bg-bg px-3 text-sm",
							value: intervalSec,
							onChange: (e) => setIntervalSec(Number(e.target.value)),
							children: INTERVAL_OPTIONS.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: o.value,
								children: o.label
							}, o.value))
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Timeout (sec)",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							type: "number",
							min: 1,
							max: 60,
							value: timeoutSec,
							onChange: (e) => setTimeoutSec(Number(e.target.value))
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Tags",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: tags,
							onChange: (e) => setTags(e.target.value),
							placeholder: "prod, api"
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 sm:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Retries before alert",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
							className: "h-10 w-full rounded-md border border-border bg-bg px-3 text-sm",
							value: maxRetries,
							onChange: (e) => setMaxRetries(Number(e.target.value)),
							children: RETRY_COUNT_OPTIONS.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: o.value,
								children: o.label
							}, o.value))
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Wait between retries",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
							className: "h-10 w-full rounded-md border border-border bg-bg px-3 text-sm",
							value: retryIntervalSec,
							onChange: (e) => setRetryIntervalSec(Number(e.target.value)),
							children: RETRY_INTERVAL_OPTIONS.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: o.value,
								children: o.label
							}, o.value))
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Resend while down",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
							className: "h-10 w-full rounded-md border border-border bg-bg px-3 text-sm",
							value: resendIntervalSec,
							onChange: (e) => setResendIntervalSec(Number(e.target.value)),
							children: RESEND_INTERVAL_OPTIONS.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: o.value,
								children: o.label
							}, o.value))
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-subtle",
				children: "Alerts fire only after retries confirm down. Recoveries notify immediately. Resend repeats the down alert on a long outage so a missed page is not silent."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex justify-end gap-2 pt-2",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "submit",
					disabled: submitting,
					children: submitting ? "Saving…" : initial?.id ? "Save monitor" : "Create monitor"
				})
			})
		]
	});
}
function Field({ label, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "grid gap-1.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: label }), children]
	});
}
//#endregion
export { MonitorForm as t };
