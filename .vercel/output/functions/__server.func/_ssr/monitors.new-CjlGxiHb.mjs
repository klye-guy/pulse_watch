import { b as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { x as saveMonitorFn } from "./fns-BD1qJbCk.mjs";
import { t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as MonitorForm } from "./monitor-form-B8Mv-TTG.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/monitors.new-CjlGxiHb.js
var import_jsx_runtime = require_jsx_runtime();
function NewMonitor() {
	const navigate = useNavigate();
	const save = useMutation({
		mutationFn: (input) => saveMonitorFn({ data: input }),
		onSuccess: (res) => {
			toast.success("Monitor created");
			navigate({
				to: "/monitors/$monitorId",
				params: { monitorId: res.id }
			});
		},
		onError: (err) => toast.error(err instanceof Error ? err.message : "Could not save")
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-3xl",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-2xl font-semibold tracking-tight",
				children: "New monitor"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 mb-6 text-sm text-muted",
				children: "HTTP, keyword, TCP, ping, or DNS — checked on the interval you set."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MonitorForm, {
					submitting: save.isPending,
					onSubmit: (input) => save.mutate(input)
				})
			})
		]
	});
}
//#endregion
export { NewMonitor as component };
